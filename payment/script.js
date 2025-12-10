/*document.addEventListener("DOMContentLoaded", function () {
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
*/
// /payment/script.js

/* bản 2
document.addEventListener("DOMContentLoaded", () => {
  if (window.Render && Render.initSharedLayout) {
    Render.initSharedLayout("../shared", "payment");
  }
  initPaymentPage();
});

// Lấy booking draft từ localStorage (được lưu ở trang Booking)
function loadBookingDraft() {
  try {
    const raw = localStorage.getItem("booking_draft");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Không parse được booking_draft:", e);
    return null;
  }
}

async function initPaymentPage() {
  const summaryEl = document.getElementById("payment-summary");
  const statusEl = document.getElementById("payment-status");
  const form = document.getElementById("payment-form");

  if (!summaryEl || !statusEl || !form) {
    console.warn("Thiếu #payment-summary / #payment-status / #payment-form");
    return;
  }

  // 1. Lấy draft từ localStorage
  const draft = loadBookingDraft();
  if (!draft) {
    summaryEl.innerHTML =
      '<p class="text-muted">No booking draft found. Please start from <a href="../home/index.html">Home</a>.</p>';
    form.style.display = "none";
    return;
  }

  // 2. Lấy thông tin hotelId từ draft hoặc localStorage
  const hotelId =
    draft.hotelId || Number(localStorage.getItem("selected_hotel_id"));

  let hotel;
  try {
    hotel = await Api.fetchHotelById(hotelId);
  } catch (err) {
    console.error("Lỗi fetch hotel cho payment:", err);
    summaryEl.innerHTML =
      '<p class="text-muted">Selected hotel is no longer available.</p>';
    form.style.display = "none";
    return;
  }

  if (!hotel) {
    summaryEl.innerHTML =
      '<p class="text-muted">Selected hotel is no longer available.</p>';
    form.style.display = "none";
    return;
  }

  // 3. Render phần summary (giống ghi chú cũ)
  renderPaymentSummary(summaryEl, hotel, draft);

  // 4. Xử lý chọn phương thức thanh toán (card / qr / wallet)
  const methodInputs = document.querySelectorAll(
    'input[name="payment-method"]'
  );
  const cardFields = document.getElementById("card-fields");
  const qrInfo = document.getElementById("qr-info");
  const walletInfo = document.getElementById("wallet-info");

  function updateMethodUI() {
    const method = getSelectedMethod();
    if (cardFields) cardFields.classList.toggle("hidden", method !== "card");
    if (qrInfo) qrInfo.classList.toggle("hidden", method !== "qr");
    if (walletInfo) walletInfo.classList.toggle("hidden", method !== "wallet");
  }

  methodInputs.forEach((input) => {
    input.addEventListener("change", updateMethodUI);
  });
  updateMethodUI();

  // 5. Nút Back
  const backBtn = document.getElementById("payment-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.Router && typeof Router.goToBooking === "function") {
        Router.goToBooking(hotelId); // dùng hotelId
      } else {
        window.location.href =
          "../booking/index.html?id=" + encodeURIComponent(hotelId);
      }
    });
  }

  // 6. Submit form thanh toán
  form.addEventListener("submit", async (e) => {
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

    try {
      await processPayment(hotel, draft, method, statusEl, hotelId);
    } catch (err) {
      console.error("Payment/processBooking error:", err);
      statusEl.textContent =
        "Payment failed: " + (err.message || "Unknown error");
      statusEl.classList.add("error");
    }
  });
}

// ===== Render booking summary giống file cũ =====
function renderPaymentSummary(el, hotel, draft) {
  const mainImage =
    hotel.images && hotel.images.length ? hotel.images[0] : "";

  el.innerHTML = `
    <h3 style="margin-top:0; margin-bottom:0.4rem;">Booking summary</h3>
    <p class="text-muted" style="margin-top:0;">
      ${hotel.name} — ${hotel.location} • ${Number(hotel.rating || 0).toFixed(
        1
      )}★
    </p>
    <div style="display:flex; gap:0.8rem; margin-top:0.7rem;">
      <div style="flex:0 0 120px;">
        <img src="${mainImage}" alt="${
          hotel.name
        }" style="width:100%; border-radius:12px; height:90px; object-fit:cover;" />
      </div>
      <div style="flex:1; font-size:0.9rem;">
        <p style="margin-top:0; margin-bottom:0.3rem;">
          Check-in: <strong>${draft.checkIn}</strong><br/>
          Check-out: <strong>${draft.checkOut}</strong><br/>
          Guests: <strong>${draft.guests}</strong>, Nights: <strong>${
    draft.nights
  }</strong>
        </p>
        <p style="margin:0.2rem 0 0;">
          <strong>Total: ${
            window.Utils && Utils.formatPrice
              ? Utils.formatPrice(draft.total)
              : Number(draft.total).toLocaleString() + " đ"
          }</strong>
        </p>
      </div>
    </div>
  `;
}

// ===== Helper: lấy method đang chọn =====
function getSelectedMethod() {
  const selected = document.querySelector(
    'input[name="payment-method"]:checked'
  );
  return selected ? selected.value : "card";
}

// ===== Validate form thẻ =====
function validateCardFields() {
  const nameEl = document.getElementById("card-name");
  const numberEl = document.getElementById("card-number");
  const expiryEl = document.getElementById("card-expiry");
  const cvvEl = document.getElementById("card-cvv");

  [nameEl, numberEl, expiryEl, cvvEl].forEach((el) => {
    if (!el) return;
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

// ===== Xử lý payment + gọi backend lưu booking =====
async function processPayment(hotel, draft, method, statusEl, hotelId) {
  const submitBtn =
    document.getElementById("payment-submit-btn") ||
    document.querySelector("#payment-form button[type='submit']");

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";
  }

  statusEl.textContent = "Processing your payment, please wait…";
  statusEl.classList.add("processing");

  // Giả lập delay 1.5s giống file cũ
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Chuẩn bị payload cho backend
  const payload = {
    userId: id, // sau này có đăng nhập thì truyền id user thật
    hotelId: hotelId, // dùng id truyền vào, không dùng hotel.id
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
    guests: Number(draft.guests),
    nights: Number(draft.nights),
    total: Number(draft.total),
    paymentMethod: method,
  };

  // Gửi lên backend để lưu vào DB
  await Api.createBooking(payload);

  // Nếu tới đây không lỗi -> coi như thanh toán thành công
  statusEl.classList.remove("processing");
  statusEl.classList.add("success");
  statusEl.textContent = "Payment successful! Your booking is confirmed.";

  // Lưu lịch sử local (tuỳ chọn)
  try {
    const historyRaw = localStorage.getItem("booking_history") || "[]";
    const history = JSON.parse(historyRaw);
    history.push({
      ...payload,
      hotelName: hotel.name,
      location: hotel.location,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("booking_history", JSON.stringify(history));
  } catch (e) {
    console.warn("Không lưu được booking_history:", e);
  }

  // Xoá draft
  localStorage.removeItem("booking_draft");

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Pay now";
  }

  // Redirect sang Profile / Booking history sau 1.5s
  setTimeout(() => {
    if (window.Router && typeof Router.goToProfile === "function") {
      Router.goToProfile();
    } else {
      window.location.href = "../profile/index.html";
    }
  }, 1500);
}
  */
 // /payment/script.js

document.addEventListener("DOMContentLoaded", () => {
  if (window.Render && Render.initSharedLayout) {
    Render.initSharedLayout("../shared", "payment");
  }
  initPaymentPage();
});

// Lấy booking draft từ localStorage (được lưu ở trang Booking)
function loadBookingDraft() {
  try {
    const raw = localStorage.getItem("booking_draft");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Không parse được booking_draft:", e);
    return null;
  }
}

// Lấy current user (ưu tiên Utils.getCurrentUser nếu có)
function getCurrentUser() {
  if (window.Utils && typeof Utils.getCurrentUser === "function") {
    return Utils.getCurrentUser();
  }
  try {
    const raw = localStorage.getItem("current_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Không parse được current_user:", e);
    return null;
  }
}

// Lấy userId để gửi lên backend (id hoặc email)
function getCurrentUserId() {
  const user = getCurrentUser();
  if (!user) return null;

  // ưu tiên id, nếu không có thì dùng email
  return (
    user.id ??
    user.userId ??
    user.StudentID ??
    user.email ??
    null
  );
}

async function initPaymentPage() {
  const summaryEl = document.getElementById("payment-summary");
  const statusEl = document.getElementById("payment-status");
  const form = document.getElementById("payment-form");

  if (!summaryEl || !statusEl || !form) {
    console.warn("Thiếu #payment-summary / #payment-status / #payment-form");
    return;
  }

  // 1. Lấy draft từ localStorage
  const draft = loadBookingDraft();
  if (!draft) {
    summaryEl.innerHTML =
      '<p class="text-muted">No booking draft found. Please start from <a href="../home/index.html">Home</a>.</p>';
    form.style.display = "none";
    return;
  }

  // 2. Lấy thông tin hotel từ backend (dựa vào draft.hotelId hoặc selected_hotel_id)
  const hotelId =
    draft.hotelId || Number(localStorage.getItem("selected_hotel_id"));

  let hotel;
  try {
    hotel = await Api.fetchHotelById(hotelId);
  } catch (err) {
    console.error("Lỗi fetch hotel cho payment:", err);
    summaryEl.innerHTML =
      '<p class="text-muted">Selected hotel is no longer available.</p>';
    form.style.display = "none";
    return;
  }

  if (!hotel) {
    summaryEl.innerHTML =
      '<p class="text-muted">Selected hotel is no longer available.</p>';
    form.style.display = "none";
    return;
  }

  // 3. Render phần summary
  renderPaymentSummary(summaryEl, hotel, draft);

  // 4. Xử lý chọn phương thức thanh toán (card / qr / wallet)
  const methodInputs = document.querySelectorAll(
    'input[name="payment-method"]'
  );
  const cardFields = document.getElementById("card-fields");
  const qrInfo = document.getElementById("qr-info");
  const walletInfo = document.getElementById("wallet-info");

  function updateMethodUI() {
    const method = getSelectedMethod();
    if (cardFields) cardFields.classList.toggle("hidden", method !== "card");
    if (qrInfo) qrInfo.classList.toggle("hidden", method !== "qr");
    if (walletInfo) walletInfo.classList.toggle("hidden", method !== "wallet");
  }

  methodInputs.forEach((input) => {
    input.addEventListener("change", updateMethodUI);
  });
  updateMethodUI();

  // 5. Nút Back
  const backBtn = document.getElementById("payment-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.Router && typeof Router.goToBooking === "function") {
        Router.goToBooking(hotel.id);
      } else {
        window.location.href =
          "../booking/index.html?id=" + encodeURIComponent(hotel.id);
      }
    });
  }

  // 6. Submit form thanh toán
  form.addEventListener("submit", async (e) => {
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

    try {
      await processPayment(hotel, draft, method, statusEl);
    } catch (err) {
      console.error("Payment/processBooking error:", err);
      statusEl.textContent =
        "Payment failed: " + (err.message || "Unknown error");
      statusEl.classList.add("error");
    }
  });
}

// ===== Render booking summary =====
function renderPaymentSummary(el, hotel, draft) {
  const mainImage =
    hotel.images && hotel.images.length ? hotel.images[0] : "";

  el.innerHTML = `
    <h3 style="margin-top:0; margin-bottom:0.4rem;">Booking summary</h3>
    <p class="text-muted" style="margin-top:0;">
      ${hotel.name} — ${hotel.location} • ${Number(hotel.rating || 0).toFixed(
    1
  )}★
    </p>
    <div style="display:flex; gap:0.8rem; margin-top:0.7rem;">
      <div style="flex:0 0 120px;">
        <img src="${mainImage}" alt="${
    hotel.name
  }" style="width:100%; border-radius:12px; height:90px; object-fit:cover;" />
      </div>
      <div style="flex:1; font-size:0.9rem;">
        <p style="margin-top:0; margin-bottom:0.3rem;">
          Check-in: <strong>${draft.checkIn}</strong><br/>
          Check-out: <strong>${draft.checkOut}</strong><br/>
          Guests: <strong>${draft.guests}</strong>, Nights: <strong>${
    draft.nights
  }</strong>
        </p>
        <p style="margin:0.2rem 0 0;">
          <strong>Total: ${
            window.Utils && Utils.formatPrice
              ? Utils.formatPrice(draft.total)
              : Number(draft.total).toLocaleString() + " đ"
          }</strong>
        </p>
      </div>
    </div>
  `;
}

// ===== Helper: lấy method đang chọn =====
function getSelectedMethod() {
  const selected = document.querySelector(
    'input[name="payment-method"]:checked'
  );
  return selected ? selected.value : "card";
}

// ===== Validate form thẻ =====
function validateCardFields() {
  const nameEl = document.getElementById("card-name");
  const numberEl = document.getElementById("card-number");
  const expiryEl = document.getElementById("card-expiry");
  const cvvEl = document.getElementById("card-cvv");

  [nameEl, numberEl, expiryEl, cvvEl].forEach((el) => {
    if (!el) return;
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

// ===== Xử lý payment + gọi backend lưu booking =====
async function processPayment(hotel, draft, method, statusEl) {
  const submitBtn =
    document.getElementById("payment-submit-btn") ||
    document.querySelector("#payment-form button[type='submit']");

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";
  }

  statusEl.textContent = "Processing your payment, please wait…";
  statusEl.classList.add("processing");

  // Giả lập delay 1.5s
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Lấy userId (email/id) – phải login
  const userId = getCurrentUserId();
  if (!userId) {
    statusEl.classList.remove("processing");
    statusEl.classList.add("error");
    statusEl.textContent = "You must login before paying.";
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Pay now";
    }
    setTimeout(() => {
      window.location.href = "../login/index.html";
    }, 1500);
    return;
  }

  // Chuẩn bị payload cho backend
  const payload = {
    userId, // email/id
    hotelId: hotel.id,
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
    guests: Number(draft.guests),
    nights: Number(draft.nights),
    total: Number(draft.total),
    paymentMethod: method,
  };

  // Gửi lên backend để lưu vào DB
  const result = await Api.createBooking(payload);

  // Nếu tới đây không lỗi -> coi như thanh toán thành công
  statusEl.classList.remove("processing");
  statusEl.classList.add("success");

  const bookingIdText =
    result && result.bookingId ? ` (#${result.bookingId})` : "";

  statusEl.textContent =
    "Payment successful" + bookingIdText + "! Your booking is confirmed.";

  // Xoá draft
  localStorage.removeItem("booking_draft");

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Pay now";
  }

  // Redirect sang Profile / Booking history sau 1.5s
  setTimeout(() => {
    if (window.Router && typeof Router.goToProfile === "function") {
      Router.goToProfile();
    } else {
      window.location.href = "../profile/index.html";
    }
  }, 1500);
}
