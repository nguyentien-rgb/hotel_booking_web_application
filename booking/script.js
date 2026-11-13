// booking/script.js — chọn ngày, số khách, xem tổng tiền rồi sang thanh toán
document.addEventListener("DOMContentLoaded", () => {
  // Chỉ khách hàng đã đăng nhập mới được đặt phòng
  if (!Router.requireRole(["customer"])) return;

  Render.initSharedLayout("../shared", "booking");
  initBookingPage();
});

const MAX_GUESTS = 20;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function addDays(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const n = Math.round((new Date(checkOut + "T00:00:00") - new Date(checkIn + "T00:00:00")) / 86400000);
  return n > 0 ? n : 0;
}

async function initBookingPage() {
  const hotelEl = document.getElementById("booking-selected-hotel");
  const form = document.getElementById("booking-stay-form");
  const hotelId = Number(Utils.getQueryParam("id"));

  if (!hotelId) {
    hotelEl.innerHTML = '<p class="text-muted" style="padding:1.2rem">No hotel selected. <a href="../search/index.html">Find a hotel</a></p>';
    form.classList.add("hidden");
    return;
  }

  let hotel;
  try {
    hotel = await Api.fetchHotelById(hotelId);
  } catch (err) {
    hotelEl.innerHTML = `<p class="form-error" style="padding:1.2rem">${escapeHtml(err.message)} <a href="../search/index.html">Back to search</a></p>`;
    form.classList.add("hidden");
    return;
  }

  renderHotel(hotelEl, hotel);
  setupForm(form, hotel);
}

function renderHotel(el, hotel) {
  const image = hotel.images && hotel.images[0] ? hotel.images[0] : "";
  el.innerHTML = `
    <img class="booking-hotel-image" src="${escapeHtml(image)}" alt="${escapeHtml(hotel.name)}" />
    <div class="booking-hotel-body">
      <span class="booking-hotel-location">${escapeHtml(hotel.location || "")} · ★ ${Number(hotel.rating || 0).toFixed(1)}</span>
      <h2 class="booking-hotel-name">${escapeHtml(hotel.name)}</h2>
      <p class="booking-hotel-desc">${escapeHtml(hotel.description || "")}</p>
      <div class="booking-hotel-price">${Utils.formatPrice(Number(hotel.price))} <span>/ guest / night</span></div>
    </div>`;
}

function setupForm(form, hotel) {
  const checkIn = document.getElementById("booking-check-in");
  const checkOut = document.getElementById("booking-check-out");
  const guests = document.getElementById("booking-guests");
  const minus = document.getElementById("guests-minus");
  const plus = document.getElementById("guests-plus");
  const summary = document.getElementById("booking-price-summary");
  const price = Number(hotel.price);

  // Mặc định: nhận phòng ngày mai, ở 1 đêm. Không cho chọn ngày đã qua.
  const today = Utils.todayIso(0);
  checkIn.min = today;
  checkIn.value = Utils.todayIso(1);
  checkOut.min = addDays(checkIn.value, 1);
  checkOut.value = addDays(checkIn.value, 1);

  function clampGuests() {
    let g = parseInt(guests.value, 10);
    if (!g || g < 1) g = 1;
    if (g > MAX_GUESTS) g = MAX_GUESTS;
    guests.value = g;
    minus.disabled = g <= 1;
    plus.disabled = g >= MAX_GUESTS;
    return g;
  }

  function update() {
    const g = clampGuests();
    const nights = nightsBetween(checkIn.value, checkOut.value);
    if (!nights) {
      summary.innerHTML = '<p class="text-muted">Select valid check-in and check-out dates.</p>';
      return;
    }
    const total = price * g * nights;
    summary.innerHTML = `
      <div class="price-line"><span>${Utils.formatPrice(price)} × ${g} guest(s) × ${nights} night(s)</span></div>
      <div class="price-total"><span>Total</span><strong>${Utils.formatPrice(total)}</strong></div>`;
  }

  checkIn.addEventListener("change", () => {
    if (!checkIn.value) return update();
    const minOut = addDays(checkIn.value, 1);
    checkOut.min = minOut;
    if (!checkOut.value || checkOut.value < minOut) checkOut.value = minOut;
    update();
  });
  checkOut.addEventListener("change", update);
  guests.addEventListener("change", update);
  minus.addEventListener("click", () => {
    guests.value = Number(guests.value) - 1;
    update();
  });
  plus.addEventListener("click", () => {
    guests.value = Number(guests.value) + 1;
    update();
  });

  document.getElementById("booking-btn-back").addEventListener("click", () => {
    Router.goToHotelDetail(hotel.id);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const g = clampGuests();
    const nights = nightsBetween(checkIn.value, checkOut.value);

    if (!checkIn.value || !checkOut.value || !nights) {
      Utils.toast("Please select valid check-in and check-out dates.", "error");
      return;
    }
    if (checkIn.value < today) {
      Utils.toast("Check-in date cannot be in the past.", "error");
      return;
    }

    // Lưu tạm để trang thanh toán dùng (server sẽ tự tính lại tổng tiền)
    const draft = {
      hotelId: hotel.id,
      hotelName: hotel.name,
      location: hotel.location,
      image: hotel.images && hotel.images[0] ? hotel.images[0] : "",
      price,
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      guests: g,
      nights,
      total: price * g * nights,
    };
    localStorage.setItem("booking_draft", JSON.stringify(draft));
    Router.goToPayment();
  });

  update();
}
