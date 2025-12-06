document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "");
  initPaymentPage();
});

function initPaymentPage() {
  const draft = Utils.loadBookingDraft();
  const hotels = window.HOTELS || [];
  const summaryEl = document.getElementById("payment-summary");
  const statusEl = document.getElementById("payment-status");

  if (!draft) {
    summaryEl.innerHTML =
      '<p class="text-muted">No booking draft found. Please start from <a href="../home/index.html">Home</a>.</p>';
    return;
  }

  const hotel = hotels.find((h) => h.id === draft.hotelId);
  if (!hotel) {
    summaryEl.innerHTML =
      '<p class="text-muted">Selected hotel is no longer available.</p>';
    return;
  }

  renderPaymentSummary(summaryEl, hotel, draft);

  const methodInputs = document.querySelectorAll('input[name="payment-method"]');
  const cardFields = document.getElementById("card-fields");
  const qrInfo = document.getElementById("qr-info");
  const walletInfo = document.getElementById("wallet-info");

  function updateMethodUI() {
    const method = getSelectedMethod();
    cardFields.classList.toggle("hidden", method !== "card");
    qrInfo.classList.toggle("hidden", method !== "qr");
    walletInfo.classList.toggle("hidden", method !== "wallet");
  }

  methodInputs.forEach(function (input) {
    input.addEventListener("change", updateMethodUI);
  });
  updateMethodUI();

  const backBtn = document.getElementById("payment-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      Router.goToBooking(hotel.id);
    });
  }

  const form = document.getElementById("payment-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.textContent = "";
    statusEl.className = "payment-status";

    const method = getSelectedMethod();
    const cardOK = method === "card" ? validateCardFields() : true;
    if (!cardOK) {
      statusEl.textContent = "Please check your credit card details.";
      statusEl.classList.add("error");
      return;
    }

    processPayment(hotel, draft, method, statusEl);
  });
}

function renderPaymentSummary(el, hotel, draft) {
  el.innerHTML = `
    <h3 style="margin-top:0; margin-bottom:0.4rem;">Booking summary</h3>
    <p class="text-muted" style="margin-top:0;">
      ${hotel.name} — ${hotel.location} • ${hotel.rating.toFixed(1)}★
    </p>
    <div style="display:flex; gap:0.8rem; margin-top:0.7rem;">
      <div style="flex:0 0 120px;">
        <img src="${
          hotel.images[0]
        }" alt="${hotel.name}" style="width:100%; border-radius:12px; height:90px; object-fit:cover;" />
      </div>
      <div style="flex:1; font-size:0.9rem;">
        <p style="margin-top:0; margin-bottom:0.3rem;">
          Check-in: <strong>${draft.checkIn}</strong><br/>
          Check-out: <strong>${draft.checkOut}</strong><br/>
          Guests: <strong>${draft.guests}</strong>, Nights: <strong>${draft.nights}</strong>
        </p>
        <p style="margin:0.2rem 0 0;"><strong>Total: ${Utils.formatPrice(
          draft.total
        )}</strong></p>
      </div>
    </div>
  `;
}

function getSelectedMethod() {
  const selected = document.querySelector('input[name="payment-method"]:checked');
  return selected ? selected.value : "card";
}

function validateCardFields() {
  const nameEl = document.getElementById("card-name");
  const numberEl = document.getElementById("card-number");
  const expiryEl = document.getElementById("card-expiry");
  const cvvEl = document.getElementById("card-cvv");

  [nameEl, numberEl, expiryEl, cvvEl].forEach(function (el) {
    el.classList.remove("input-error");
  });

  let valid = true;

  if (!nameEl.value.trim()) {
    nameEl.classList.add("input-error");
    valid = false;
  }

  const digitsOnly = numberEl.value.replace(/\D/g, "");
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    numberEl.classList.add("input-error");
    valid = false;
  }

  if (!/^\d{2}\/\d{2}$/.test(expiryEl.value)) {
    expiryEl.classList.add("input-error");
    valid = false;
  }

  if (!/^\d{3}$/.test(cvvEl.value)) {
    cvvEl.classList.add("input-error");
    valid = false;
  }

  return valid;
}

function processPayment(hotel, draft, method, statusEl) {
  const submitBtn = document.getElementById("payment-submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing...";
  statusEl.textContent = "Processing your payment, please wait…";
  statusEl.classList.add("processing");

  setTimeout(function () {
    submitBtn.disabled = false;
    submitBtn.textContent = "Pay now";
    statusEl.classList.remove("processing");
    statusEl.classList.add("success");
    statusEl.textContent = "Payment successful! Your booking is confirmed.";

    Utils.saveCompletedBooking({
      hotelId: hotel.id,
      hotelName: hotel.name,
      location: hotel.location,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      guests: draft.guests,
      nights: draft.nights,
      total: draft.total,
      method: method,
      createdAt: new Date().toISOString(),
    });

    Utils.clearBookingDraft();

    setTimeout(function () {
      Router.goToProfile();
    }, 1500);
  }, 1500);
}
