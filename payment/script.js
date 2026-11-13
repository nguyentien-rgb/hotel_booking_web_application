// payment/script.js — thanh toán giả lập (không trừ tiền thật)
// Luồng: chọn phương thức → kiểm tra dữ liệu → màn hình xử lý từng bước → gọi API tạo booking.
document.addEventListener("DOMContentLoaded", () => {
  // Chỉ khách hàng đã đăng nhập mới được thanh toán
  const user = Router.requireRole(["customer"]);
  if (!user) return;

  Render.initSharedLayout("../shared", "payment");
  initPaymentPage(user);
});

const METHOD_LABEL = { card: "Card", qr: "Bank QR", wallet: "E-wallet" };
const QR_SECONDS = 10 * 60;

let DRAFT = null;
let qrTimer = null;
let qrRef = "";

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function formatDate(iso) {
  const [y, m, d] = String(iso).split("-");
  return `${d}/${m}/${y}`;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem("booking_draft") || "null");
  } catch {
    return null;
  }
}

function initPaymentPage(user) {
  DRAFT = loadDraft();

  if (!DRAFT || !DRAFT.hotelId) {
    document.getElementById("payment-layout").innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🧾</div>
        <h3>No booking to pay for</h3>
        <p>Choose a hotel and your dates first.</p>
        <a class="btn btn-gold" href="../search/index.html">Find a stay</a>
      </div>`;
    return;
  }

  renderSummary();
  setupMethods();
  setupCardFields();

  const walletPhone = document.getElementById("wallet-phone");
  if (user.phone) walletPhone.value = user.phone;
}

// ================== TÓM TẮT ĐƠN ==================

function renderSummary() {
  const d = DRAFT;
  document.getElementById("payment-summary").innerHTML = `
    ${d.image ? `<img class="pay-summary-image" src="${escapeHtml(d.image)}" alt="" />` : ""}
    <div class="pay-summary-body">
      <h2 class="pay-summary-name">${escapeHtml(d.hotelName)}</h2>
      <span class="pay-summary-location">${escapeHtml(d.location || "")}</span>

      <dl class="pay-summary-list">
        <dt>Check-in</dt><dd>${formatDate(d.checkIn)}</dd>
        <dt>Check-out</dt><dd>${formatDate(d.checkOut)}</dd>
        <dt>Guests</dt><dd>${d.guests}</dd>
        <dt>Nights</dt><dd>${d.nights}</dd>
        ${d.price ? `<dt>Price</dt><dd>${Utils.formatPrice(Number(d.price))} / guest / night</dd>` : ""}
      </dl>

      <div class="pay-summary-total"><span>Total</span><strong>${Utils.formatPrice(Number(d.total))}</strong></div>

      <button type="button" class="btn btn-gold btn-full" id="pay-btn">Pay ${Utils.formatPrice(Number(d.total))}</button>
      <button type="button" class="btn btn-ghost btn-full" id="pay-back-btn">Back to booking</button>
      <p class="pay-secure">🔒 Demo payment · no real money is charged</p>
    </div>`;

  document.getElementById("pay-btn").addEventListener("click", startPayment);
  document.getElementById("pay-back-btn").addEventListener("click", () => {
    window.location.href = "../booking/index.html?id=" + encodeURIComponent(DRAFT.hotelId);
  });
}

// ================== CHỌN PHƯƠNG THỨC ==================

function selectedMethod() {
  const r = document.querySelector('input[name="payment-method"]:checked');
  return r ? r.value : "card";
}

function setupMethods() {
  document.querySelectorAll('input[name="payment-method"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      const method = selectedMethod();
      document.querySelectorAll(".pay-panel").forEach((p) =>
        p.classList.toggle("hidden", p.dataset.panel !== method)
      );
      document.getElementById("payment-error").textContent = "";
      if (method === "qr") startQr();
      else stopQr();
    })
  );
}

// ================== THẺ ==================

function detectBrand(digits) {
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "MASTERCARD";
  if (/^9704/.test(digits)) return "NAPAS";
  return "CARD";
}

// Thuật toán Luhn: cách ngân hàng kiểm tra số thẻ hợp lệ
function luhnValid(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return digits.length >= 13 && sum % 10 === 0;
}

function setupCardFields() {
  const number = document.getElementById("card-number");
  const name = document.getElementById("card-name");
  const expiry = document.getElementById("card-expiry");
  const cvv = document.getElementById("card-cvv");

  // Tự thêm dấu cách mỗi 4 số và cập nhật thẻ xem trước
  number.addEventListener("input", () => {
    const digits = number.value.replace(/\D/g, "").slice(0, 16);
    number.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    const masked = (digits + "•".repeat(16 - digits.length)).replace(/(.{4})(?=.)/g, "$1 ");
    document.getElementById("cp-number").textContent = masked;
    document.getElementById("cp-brand").textContent = detectBrand(digits);
  });

  name.addEventListener("input", () => {
    name.value = name.value.toUpperCase();
    document.getElementById("cp-name").textContent = name.value.trim() || "YOUR NAME";
  });

  // MM/YY
  expiry.addEventListener("input", () => {
    const digits = expiry.value.replace(/\D/g, "").slice(0, 4);
    expiry.value = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
    document.getElementById("cp-expiry").textContent = expiry.value || "MM/YY";
  });

  cvv.addEventListener("input", () => {
    cvv.value = cvv.value.replace(/\D/g, "").slice(0, 3);
  });
}

function validateCard() {
  const digits = document.getElementById("card-number").value.replace(/\D/g, "");
  const name = document.getElementById("card-name").value.trim();
  const expiry = document.getElementById("card-expiry").value;
  const cvv = document.getElementById("card-cvv").value;

  if (!luhnValid(digits)) return "Card number is not valid.";
  if (!name) return "Please enter the name on the card.";

  const m = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return "Expiry date must be MM/YY.";
  const now = new Date();
  const expYear = 2000 + Number(m[2]);
  const expMonth = Number(m[1]);
  if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1))
    return "This card has expired.";

  if (!/^\d{3}$/.test(cvv)) return "CVV must be 3 digits.";
  return "";
}

// ================== QR ==================

function startQr() {
  stopQr();
  qrRef = "HB" + Date.now().toString(36).toUpperCase().slice(-6);
  const total = Number(DRAFT.total);

  document.getElementById("qr-amount").textContent = Utils.formatPrice(total);
  document.getElementById("qr-ref").textContent = qrRef;

  const box = document.getElementById("qr-code");
  box.innerHTML = "";
  const payload = `LHB DEMO BANK|ACC:012345678910|AMOUNT:${total}|NOTE:${qrRef}`;
  if (window.QRCode) {
    new QRCode(box, { text: payload, width: 180, height: 180, colorDark: "#111827", colorLight: "#ffffff" });
  } else {
    box.innerHTML = '<span class="text-muted" style="font-size:0.8rem">QR unavailable offline</span>';
  }

  let left = QR_SECONDS;
  const countdown = document.getElementById("qr-countdown");
  const tick = () => {
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    countdown.textContent = `${mm}:${ss}`;
    if (left-- <= 0) {
      Utils.toast("QR code expired. A new code has been generated.", "info");
      startQr();
    }
  };
  tick();
  qrTimer = setInterval(tick, 1000);
}

function stopQr() {
  if (qrTimer) clearInterval(qrTimer);
  qrTimer = null;
}

// ================== THANH TOÁN ==================

async function startPayment() {
  const method = selectedMethod();
  const errorEl = document.getElementById("payment-error");
  errorEl.textContent = "";

  if (method === "card") {
    const err = validateCard();
    if (err) {
      errorEl.textContent = err;
      return;
    }
  }
  if (method === "wallet") {
    const phone = document.getElementById("wallet-phone").value.trim();
    if (!/^[0-9+ ]{9,15}$/.test(phone)) {
      errorEl.textContent = "Please enter a valid wallet phone number.";
      return;
    }
  }

  openModal();
  const steps = document.querySelectorAll("#pay-steps li");

  try {
    for (let i = 0; i < 3; i++) {
      setStep(steps, i);
      await wait(800 + Math.random() * 500);

      // Thẻ test bị từ chối
      if (i === 1 && method === "card") {
        const digits = document.getElementById("card-number").value.replace(/\D/g, "");
        if (digits === "4000000000000002") throw new Error("Your card was declined by the bank.");
      }
    }

    // Bước cuối: tạo booking thật trên server
    setStep(steps, 3);
    const result = await Api.createBooking({
      hotelId: DRAFT.hotelId,
      checkIn: DRAFT.checkIn,
      checkOut: DRAFT.checkOut,
      guests: Number(DRAFT.guests),
      paymentMethod: method,
    });
    await wait(500);
    setStep(steps, 4);

    localStorage.removeItem("booking_draft");
    stopQr();
    showSuccess(result, method);
  } catch (err) {
    showError(err.message);
  }
}

function openModal() {
  const modal = document.getElementById("pay-modal");
  document.getElementById("pay-modal-icon").innerHTML = '<span class="spinner"></span>';
  document.getElementById("pay-modal-title").textContent = "Processing payment";
  document.getElementById("pay-steps").classList.remove("hidden");
  document.querySelectorAll("#pay-steps li").forEach((li) => li.classList.remove("active", "done"));
  document.getElementById("pay-modal-result").classList.add("hidden");
  document.getElementById("pay-modal-actions").classList.add("hidden");
  modal.classList.remove("hidden");
  document.getElementById("pay-btn").disabled = true;
}

function closeModal() {
  document.getElementById("pay-modal").classList.add("hidden");
  document.getElementById("pay-btn").disabled = false;
}

function setStep(steps, index) {
  steps.forEach((li, i) => {
    li.classList.toggle("done", i < index);
    li.classList.toggle("active", i === index);
  });
}

function showSuccess(result, method) {
  const total = result && result.total != null ? result.total : DRAFT.total;
  document.getElementById("pay-modal-icon").innerHTML = '<span class="result-icon success">✓</span>';
  document.getElementById("pay-modal-title").textContent = "Payment successful";
  document.getElementById("pay-steps").classList.add("hidden");

  const resultEl = document.getElementById("pay-modal-result");
  resultEl.innerHTML = `
    Booking <strong>#${result.bookingId}</strong> · ${escapeHtml(DRAFT.hotelName)}<br />
    Paid <strong>${Utils.formatPrice(Number(total))}</strong> via ${METHOD_LABEL[method]}.<br />
    The hotel will confirm your booking soon.`;
  resultEl.classList.remove("hidden");

  const actions = document.getElementById("pay-modal-actions");
  actions.innerHTML = `
    <a class="btn btn-gold btn-full" href="../profile/index.html">View my bookings</a>
    <a class="btn btn-ghost btn-full" href="../home/index.html">Back to home</a>`;
  actions.classList.remove("hidden");
}

function showError(message) {
  document.getElementById("pay-modal-icon").innerHTML = '<span class="result-icon error">✕</span>';
  document.getElementById("pay-modal-title").textContent = "Payment failed";
  document.getElementById("pay-steps").classList.add("hidden");

  const resultEl = document.getElementById("pay-modal-result");
  resultEl.textContent = message || "Something went wrong. Please try again.";
  resultEl.classList.remove("hidden");

  const actions = document.getElementById("pay-modal-actions");
  actions.innerHTML = '<button type="button" class="btn btn-gold btn-full" id="pay-retry-btn">Try again</button>';
  actions.classList.remove("hidden");
  document.getElementById("pay-retry-btn").addEventListener("click", closeModal);
}
