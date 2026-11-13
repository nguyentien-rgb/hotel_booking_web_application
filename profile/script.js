// profile/script.js — trang cá nhân của khách hàng
document.addEventListener("DOMContentLoaded", function () {
  // Chỉ customer; owner/admin bị chuyển về trang quản lý của họ
  const user = Router.requireRole(["customer"]);
  if (!user) return;

  Render.initSharedLayout("../shared", "profile");
  renderUserInfo(user);
  refreshUserInfo(user);
  initEvents();
  loadBookings();
});

const STATUS_LABEL = {
  pending: "Waiting",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const today = Utils.todayIso(0);
let BOOKINGS = [];
let currentTab = "all";

const TAB_FILTER = {
  all: () => true,
  upcoming: (b) => (b.status === "pending" || b.status === "confirmed") && b.checkOut >= today,
  past: (b) => b.status === "completed" || (b.status === "confirmed" && b.checkOut < today),
  cancelled: (b) => b.status === "cancelled",
};

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

// "2026-11-20" → "20/11/2026"
function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Được huỷ khi đang chờ hoặc đã xác nhận, và chưa tới ngày nhận phòng (server cũng kiểm tra lại)
function canCancel(b) {
  return (b.status === "pending" || b.status === "confirmed") && b.checkIn > today;
}

function renderUserInfo(user) {
  const name = (user.name || "Guest").trim();
  const parts = name.split(/\s+/);
  document.getElementById("profile-avatar").textContent = parts[parts.length - 1].charAt(0).toUpperCase();
  document.getElementById("profile-name").textContent = name;
  document.getElementById("profile-email").textContent = user.email || "";
  document.getElementById("profile-phone").textContent = user.phone || "No phone number";
}

// Phiên đăng nhập cũ chưa lưu số điện thoại → lấy thông tin mới nhất từ server
async function refreshUserInfo(user) {
  try {
    const me = await Api.fetchMe();
    const updated = { ...user, ...me };
    Utils.setCurrentUser(updated);
    renderUserInfo(updated);
  } catch (err) {
    console.warn("Cannot refresh user info:", err);
  }
}

function initEvents() {
  document.getElementById("profile-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (!tab) return;
    currentTab = tab.dataset.tab;
    document.querySelectorAll(".profile-tab").forEach((t) => t.classList.toggle("active", t === tab));
    renderBookings();
  });

  document.getElementById("profile-booking-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cancel]");
    if (btn) cancelBooking(Number(btn.dataset.cancel), btn);
  });
}

async function loadBookings() {
  const listEl = document.getElementById("profile-booking-list");
  try {
    BOOKINGS = await Api.fetchMyBookings();
    renderBookings();
  } catch (err) {
    listEl.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
  }
}

function renderBookings() {
  const listEl = document.getElementById("profile-booking-list");
  const items = BOOKINGS.filter(TAB_FILTER[currentTab]);

  if (!items.length) {
    listEl.innerHTML = `<p class="profile-empty">No bookings here. <a href="../search/index.html">Find a stay</a></p>`;
    return;
  }

  listEl.innerHTML = items
    .map((b) => {
      const url = "../hotel-detail/index.html?id=" + encodeURIComponent(b.hotelId);
      return `
        <div class="booking-row">
          <img class="booking-row-image" src="${escapeHtml(b.hotelImage || "")}" alt="" />
          <div class="booking-row-info">
            <a class="booking-row-name" href="${url}">${escapeHtml(b.hotelName)}</a>
            <div class="booking-row-meta">
              ${formatDate(b.checkIn)} – ${formatDate(b.checkOut)} · ${b.nights} night(s) · ${b.guests} guest(s)
            </div>
          </div>
          <div class="booking-row-side">
            <span class="status-badge status-${b.status}">${STATUS_LABEL[b.status] || b.status}</span>
            <span class="booking-row-total">${Utils.formatPrice(Number(b.total))}</span>
            ${canCancel(b) ? `<button class="booking-row-cancel" data-cancel="${b.id}" type="button">Cancel</button>` : ""}
          </div>
        </div>`;
    })
    .join("");
}

async function cancelBooking(id, btn) {
  if (!confirm("Cancel this booking?")) return;

  btn.disabled = true;
  try {
    await Api.cancelBooking(id);
    Utils.toast("Booking cancelled.", "success");
    await loadBookings();
  } catch (err) {
    Utils.toast(err.message, "error");
    btn.disabled = false;
  }
}
