document.addEventListener("DOMContentLoaded", function () {
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
