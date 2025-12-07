/*document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "");
  initBookingPage();
});

function initBookingPage() {
  const idStr = Utils.getQueryParam("id");
  const id = idStr ? Number(idStr) : NaN;
  const hotels = window.HOTELS || [];
  const hotel = hotels.find((h) => h.id === id);

  if (!hotel) {
    const summaryEl = document.getElementById("booking-hotel-summary");
    summaryEl.innerHTML =
      '<p class="text-muted">No hotel selected. Please choose a hotel from <a href="../search/index.html">Search</a>.</p>';
    return;
  }

  renderHotelSummary(hotel);
  setupBookingForm(hotel);
}

function renderHotelSummary(hotel) {
  const el = document.getElementById("booking-hotel-summary");
  const img = hotel.images && hotel.images[0] ? hotel.images[0] : "";
  el.innerHTML = `
    <div class="booking-hotel-header">
      <h3 style="margin-top:0; margin-bottom:0.2rem;">${hotel.name}</h3>
      <p class="text-muted" style="margin:0;">${hotel.location} • ${
    hotel.rating
  }★</p>
    </div>
    <div class="booking-hotel-body" style="display:flex; gap:0.8rem; margin-top:0.8rem;">
      <div style="flex:0 0 120px;">
        <img src="${img}" alt="${hotel.name}" style="width:100%; border-radius:12px; height:90px; object-fit:cover;" />
      </div>
      <div style="flex:1; font-size:0.9rem;">
        <p style="margin-top:0; margin-bottom:0.3rem;">${
          hotel.description
        }</p>
        <p class="text-muted" style="margin:0;">Base price: ${Utils.formatPrice(
          hotel.price
        )} / guest / night</p>
      </div>
    </div>
  `;
}

function setupBookingForm(hotel) {
  const form = document.getElementById("booking-form");
  const checkInInput = document.getElementById("checkin");
  const checkOutInput = document.getElementById("checkout");
  const guestsInput = document.getElementById("guests");
  const summaryEl = document.getElementById("booking-price-summary");
  const errorEl = document.getElementById("booking-error");
  const backBtn = document.getElementById("booking-back-btn");

  function updatePrice() {
    errorEl.textContent = "";
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const guests = Number(guestsInput.value || "1");
    const nights = Utils.calcNights(checkIn, checkOut);
    if (!checkIn || !checkOut || nights <= 0) {
      summaryEl.textContent = "Select valid check-in and check-out dates.";
      return;
    }
    const total = nights * hotel.price * guests;
    summaryEl.textContent =
      nights +
      " night(s) × " +
      guests +
      " guest(s) × " +
      Utils.formatPrice(hotel.price) +
      " = " +
      Utils.formatPrice(total);
  }

  checkInInput.addEventListener("change", updatePrice);
  checkOutInput.addEventListener("change", updatePrice);
  guestsInput.addEventListener("input", updatePrice);

  if (backBtn) {
    backBtn.addEventListener("click", function () {
      Router.goToHotelDetail(hotel.id);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const guests = Number(guestsInput.value || "1");
    const nights = Utils.calcNights(checkIn, checkOut);

    if (!checkIn || !checkOut || nights <= 0) {
      errorEl.textContent = "Please select valid check-in and check-out dates.";
      return;
    }

    const total = nights * hotel.price * guests;

    Utils.saveBookingDraft({
      hotelId: hotel.id,
      checkIn,
      checkOut,
      guests,
      nights,
      total,
      createdAt: new Date().toISOString(),
    });

    Router.goToPayment();
  });
}
*/
// /booking/script.js

document.addEventListener("DOMContentLoaded", () => {
  if (window.Render && Render.initSharedLayout) {
    Render.initSharedLayout("../shared", "booking");
  }
  initBookingPage();
});

function getQueryParam(name) {
  if (window.Utils && typeof Utils.getQueryParam === "function") {
    return Utils.getQueryParam(name);
  }
  return new URLSearchParams(window.location.search).get(name);
}

async function initBookingPage() {
  const cardEl = document.getElementById("booking-selected-hotel");
  const formEl = document.getElementById("booking-stay-form");
  const summaryEl = document.getElementById("booking-price-summary");
  const btnBack = document.getElementById("booking-btn-back");
  const btnProceed = document.getElementById("booking-btn-proceed");

  if (!cardEl || !formEl || !summaryEl) {
    console.warn("Thiếu #booking-selected-hotel hoặc #booking-stay-form hoặc #booking-price-summary");
    return;
  }

  const idStr = getQueryParam("id") || getQueryParam("hotelId");
  const hotelId = idStr ? Number(idStr) : NaN;
  console.log("Booking page hotelId =", hotelId);

  // Nếu không có id -> báo "No hotel selected"
  if (!hotelId) {
    cardEl.innerHTML =
      '<p class="booking-empty">No hotel selected. Please choose a hotel from <a href="../search/index.html">Search</a>.</p>';
    formEl.style.opacity = "0.6";
    formEl.querySelectorAll("input, button").forEach((el) => (el.disabled = false)); // vẫn cho nhập
    return;
  }

  // Lấy thông tin khách sạn từ backend
  let hotel;
  try {
    hotel = await Api.fetchHotelById(hotelId);
  } catch (err) {
    console.error("Lỗi khi lấy hotel cho booking:", err);
    cardEl.innerHTML =
      '<p class="booking-empty">Failed to load selected hotel. Please try again from <a href="../search/index.html">Search</a>.</p>';
    return;
  }

  if (!hotel) {
    cardEl.innerHTML =
      '<p class="booking-empty">Hotel not found. Please choose again from <a href="../search/index.html">Search</a>.</p>';
    return;
  }

  // Render card bên trái
  const mainImage =
    hotel.images && hotel.images.length ? hotel.images[0] : "";

  cardEl.innerHTML = `
    <div class="booking-hotel-card">
      <h2>${hotel.name}</h2>
      <div class="booking-hotel-meta">
        <span>${hotel.location}</span> •
        <span>${Number(hotel.rating || 0).toFixed(1)}★</span>
      </div>
      <div class="booking-hotel-body">
        <img class="booking-hotel-image" src="${mainImage}" alt="${hotel.name}">
        <div class="booking-hotel-text">
          <p class="booking-hotel-desc">${hotel.description || ""}</p>
          <p class="booking-hotel-price">
            Base price:
            ${
              window.Utils && Utils.formatPrice
                ? Utils.formatPrice(hotel.price)
                : hotel.price.toLocaleString() + " đ"
            }
            / guest / night
          </p>
        </div>
      </div>
    </div>
  `;

  // Lưu vài thông tin để payment dùng
  localStorage.setItem("selected_hotel_id", String(hotel.id));
  localStorage.setItem("selected_hotel_name", hotel.name);
  localStorage.setItem("selected_hotel_price", String(hotel.price));

  // ===== Xử lý form stay details =====
  const checkInInput = formEl.querySelector("#booking-check-in");
  const checkOutInput = formEl.querySelector("#booking-check-out");
  const guestsInput = formEl.querySelector("#booking-guests");

  function calcNights() {
    if (!checkInInput.value || !checkOutInput.value) return 0;
    const inDate = new Date(checkInInput.value);
    const outDate = new Date(checkOutInput.value);
    const diffMs = outDate - inDate;
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  }

  function updateSummary() {
    const nights = calcNights();
    const guests = Number(guestsInput.value || "1");
    if (!nights) {
      summaryEl.textContent = "Select dates to calculate your stay.";
      return;
    }
    const total = nights * guests * Number(hotel.price);

    summaryEl.textContent =
      `${nights} night(s) • ${guests} guest(s) — Total: ` +
      (window.Utils && Utils.formatPrice
        ? Utils.formatPrice(total)
        : total.toLocaleString() + " đ");
  }

  // Re-calc khi đổi ngày / số khách
  [checkInInput, checkOutInput, guestsInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("change", updateSummary);
    input.addEventListener("input", updateSummary);
  });

  // Nút Back
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      if (window.history.length > 1) window.history.back();
      else window.location.href = "../search/index.html";
    });
  }

  // Nút Proceed to payment
  if (btnProceed) {
    btnProceed.addEventListener("click", (e) => {
      e.preventDefault();

      const nights = calcNights();
      const guests = Number(guestsInput.value || "1");

      if (!checkInInput.value || !checkOutInput.value) {
        alert("Please select both check-in and check-out dates.");
        return;
      }
      if (nights <= 0) {
        alert("Check-out must be after check-in.");
        return;
      }
      if (!guests || guests <= 0) {
        alert("Guests must be at least 1.");
        return;
      }

      const total = nights * guests * Number(hotel.price);

      // Lưu draft để payment page dùng
      const draft = {
        hotelId: hotel.id,
        checkIn: checkInInput.value,
        checkOut: checkOutInput.value,
        guests,
        nights,
        total,
      };
      localStorage.setItem("booking_draft", JSON.stringify(draft));

      // Chuyển sang payment
      if (window.Router && typeof Router.goToPayment === "function") {
        Router.goToPayment();
      } else {
        window.location.href = "../payment/index.html";
      }
    });
  }

  // Khởi tạo summary ban đầu
  updateSummary();
}

