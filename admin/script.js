// admin/script.js — trang quản trị
document.addEventListener("DOMContentLoaded", function () {
  const user = Router.requireRole(["admin"]);
  if (!user) return;

  Render.initSharedLayout("../shared", "admin");

  initTabs();

  const hotelFilter = document.getElementById("hotel-filter");
  hotelFilter.addEventListener("change", () => loadHotels(hotelFilter.value));

  const userFilter = document.getElementById("user-filter");
  userFilter.addEventListener("change", () => loadUsers(userFilter.value));

  const bookingFilter = document.getElementById("admin-booking-filter");
  bookingFilter.addEventListener("change", () => loadBookings(bookingFilter.value));

  loadStats();
  loadHotels(hotelFilter.value);
  loadUsers(userFilter.value);
  loadBookings(bookingFilter.value);
});

const STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  active: "Active",
  locked: "Locked",
};

// Escape dùng chung (escape cả dấu nháy để an toàn trong thuộc tính HTML)
const escapeHtml = Utils.escapeHtml;

function badge(status) {
  return `<span class="status-badge status-${status}">${STATUS_LABEL[status] || status}</span>`;
}

function errorRow(cols, err) {
  return `<tr><td colspan="${cols}" class="form-error">${escapeHtml(err.message)}</td></tr>`;
}

function emptyRow(cols, text) {
  return `<tr><td colspan="${cols}" class="text-muted">${text}</td></tr>`;
}

function initTabs() {
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".admin-panel").forEach((p) =>
        p.classList.toggle("hidden", p.id !== "panel-" + tab.dataset.tab)
      );
    });
  });
}

// ================== THỐNG KÊ ==================

async function loadStats() {
  const grid = document.getElementById("stat-grid");
  try {
    const s = await Api.admin.stats();
    const items = [
      { value: s.pendingHotels, label: "Hotels waiting for approval", highlight: s.pendingHotels > 0 },
      { value: s.totalHotels, label: "Hotels" },
      { value: s.totalUsers, label: `Users (${s.totalCustomers} customers, ${s.totalOwners} owners)` },
      { value: s.totalBookings, label: `Bookings (${s.pendingBookings} waiting)` },
      { value: Utils.formatPrice(Number(s.revenue)), label: "Revenue (confirmed + completed)" },
    ];
    grid.innerHTML = items
      .map(
        (i) => `
        <div class="card stat-card${i.highlight ? " highlight" : ""}">
          <span class="stat-value">${i.value}</span>
          <span class="stat-label">${i.label}</span>
        </div>`
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<div class="card form-error">${escapeHtml(err.message)}</div>`;
  }
}

// ================== KHÁCH SẠN ==================

async function loadHotels(status) {
  const body = document.getElementById("hotel-table-body");
  body.innerHTML = emptyRow(5, "Loading...");
  try {
    const hotels = await Api.admin.hotels(status);
    if (!hotels.length) {
      body.innerHTML = emptyRow(5, "No hotels.");
      return;
    }

    body.innerHTML = hotels
      .map((h) => {
        const actions = [];
        if (h.status !== "approved")
          actions.push(`<button class="btn btn-gold btn-sm" data-approve="${h.id}">Approve</button>`);
        if (h.status !== "rejected")
          actions.push(`<button class="btn btn-danger btn-sm" data-reject="${h.id}">Reject</button>`);

        return `
          <tr>
            <td>
              <div class="hotel-cell">
                ${h.image ? `<img class="hotel-thumb" src="${escapeHtml(h.image)}" alt="" />` : '<div class="hotel-thumb"></div>'}
                <div>
                  <strong>${escapeHtml(h.name)}</strong>
                  <span class="cell-sub">${escapeHtml(h.location || "")}</span>
                </div>
              </div>
            </td>
            <td>${escapeHtml(h.ownerName)}<span class="cell-sub">${escapeHtml(h.ownerEmail)}</span></td>
            <td>${Utils.formatPrice(Number(h.price))}</td>
            <td>${badge(h.status)}</td>
            <td><div class="actions">${actions.join("")}</div></td>
          </tr>`;
      })
      .join("");

    body.querySelectorAll("[data-approve]").forEach((btn) =>
      btn.addEventListener("click", () => hotelAction("approve", Number(btn.dataset.approve)))
    );
    body.querySelectorAll("[data-reject]").forEach((btn) =>
      btn.addEventListener("click", () => hotelAction("reject", Number(btn.dataset.reject)))
    );
  } catch (err) {
    body.innerHTML = errorRow(5, err);
  }
}

async function hotelAction(action, id) {
  if (action === "reject" && !confirm("Reject this hotel? It will be hidden from customers.")) return;
  try {
    if (action === "approve") await Api.admin.approveHotel(id);
    else await Api.admin.rejectHotel(id);

    Utils.toast(action === "approve" ? "Hotel approved." : "Hotel rejected.", "success");
    await Promise.all([loadHotels(document.getElementById("hotel-filter").value), loadStats()]);
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

// ================== NGƯỜI DÙNG ==================

async function loadUsers(role) {
  const body = document.getElementById("user-table-body");
  body.innerHTML = emptyRow(6, "Loading...");
  try {
    const users = await Api.admin.users(role);
    if (!users.length) {
      body.innerHTML = emptyRow(6, "No users.");
      return;
    }

    body.innerHTML = users
      .map((u) => {
        let action = '<span class="text-muted">—</span>';
        if (u.role !== "admin") {
          action = u.isActive
            ? `<button class="btn btn-danger btn-sm" data-lock="${u.id}">Lock</button>`
            : `<button class="btn btn-outline btn-sm" data-unlock="${u.id}">Unlock</button>`;
        }
        return `
          <tr>
            <td>${u.id}</td>
            <td>
              ${escapeHtml(u.name)}<span class="cell-sub">${escapeHtml(u.email)}</span>
              ${u.phone ? `<span class="cell-sub">📞 ${escapeHtml(u.phone)}${u.businessName ? " · " + escapeHtml(u.businessName) : ""}</span>` : ""}
            </td>
            <td>${escapeHtml(u.role)}</td>
            <td>${badge(u.isActive ? "active" : "locked")}</td>
            <td>${String(u.createdAt).slice(0, 10)}</td>
            <td><div class="actions">${action}</div></td>
          </tr>`;
      })
      .join("");

    body.querySelectorAll("[data-lock]").forEach((btn) =>
      btn.addEventListener("click", () => userAction("lock", Number(btn.dataset.lock)))
    );
    body.querySelectorAll("[data-unlock]").forEach((btn) =>
      btn.addEventListener("click", () => userAction("unlock", Number(btn.dataset.unlock)))
    );
  } catch (err) {
    body.innerHTML = errorRow(6, err);
  }
}

async function userAction(action, id) {
  if (action === "lock" && !confirm("Lock this account? The user will no longer be able to log in.")) return;
  try {
    if (action === "lock") await Api.admin.lockUser(id);
    else await Api.admin.unlockUser(id);

    Utils.toast(action === "lock" ? "Account locked." : "Account unlocked.", "success");
    await loadUsers(document.getElementById("user-filter").value);
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

// ================== BOOKING ==================

async function loadBookings(status) {
  const body = document.getElementById("admin-booking-table-body");
  body.innerHTML = emptyRow(6, "Loading...");
  try {
    const bookings = await Api.admin.bookings(status);
    if (!bookings.length) {
      body.innerHTML = emptyRow(6, "No bookings.");
      return;
    }

    body.innerHTML = bookings
      .map(
        (b) => `
        <tr>
          <td>${b.id}</td>
          <td>${escapeHtml(b.hotelName)}<span class="cell-sub">Owner: ${escapeHtml(b.ownerName)}</span></td>
          <td>${escapeHtml(b.guestName)}<span class="cell-sub">${escapeHtml(b.guestEmail)}</span></td>
          <td>${b.checkIn} → ${b.checkOut}<span class="cell-sub">${b.nights} night(s), ${b.guests} guest(s)</span></td>
          <td>${Utils.formatPrice(Number(b.total))}</td>
          <td>${badge(b.status)}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    body.innerHTML = errorRow(6, err);
  }
}
