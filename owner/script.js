// owner/script.js — trang quản lý của chủ khách sạn
document.addEventListener("DOMContentLoaded", function () {
  const user = Router.requireRole(["owner"]);
  if (!user) return;

  Render.initSharedLayout("../shared", "owner");

  document.getElementById("owner-welcome").textContent =
    "Welcome, " + user.name + ". Manage your hotels and incoming bookings.";

  initProfileForm();
  loadProfile();
  initHotelForm();
  loadHotels();

  const filter = document.getElementById("booking-filter");
  filter.addEventListener("change", () => loadBookings(filter.value));
  loadBookings(filter.value);
});

const HOTEL_STATUS_LABEL = { pending: "Pending approval", approved: "Approved", rejected: "Rejected" };
const BOOKING_STATUS_LABEL = {
  pending: "Waiting",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

let myHotels = [];
let editingHotelId = null;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function badge(status, labels) {
  return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
}

// ================== HỒ SƠ CHỦ KHÁCH SẠN ==================

async function loadProfile() {
  try {
    const p = await Api.owner.profile();
    document.getElementById("pf-name").value = p.name;
    document.getElementById("pf-email").value = p.email;
    document.getElementById("pf-phone").value = p.phone || "";
    document.getElementById("pf-business").value = p.businessName || "";
    document.getElementById("pf-tax").value = p.taxCode || "";
  } catch (err) {
    document.getElementById("profile-error").textContent = err.message;
  }
}

function initProfileForm() {
  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("profile-error");
    const btn = document.getElementById("profile-save-btn");
    errorEl.textContent = "";

    const data = {
      phone: document.getElementById("pf-phone").value.trim(),
      businessName: document.getElementById("pf-business").value.trim(),
      taxCode: document.getElementById("pf-tax").value.trim() || null,
    };

    if (!/^[0-9+ ]{9,15}$/.test(data.phone)) {
      errorEl.textContent = "Please enter a valid phone number.";
      return;
    }
    if (data.taxCode && !/^[0-9-]{10,14}$/.test(data.taxCode)) {
      errorEl.textContent = "Tax code must be 10–14 digits.";
      return;
    }

    btn.disabled = true;
    try {
      await Api.owner.saveProfile(data);
      Utils.toast("Profile saved.", "success");
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

// ================== KHÁCH SẠN ==================

async function loadHotels() {
  const body = document.getElementById("hotel-table-body");
  try {
    myHotels = await Api.owner.hotels();

    // Mỗi chủ chỉ có 1 khách sạn: đã có thì ẩn nút thêm
    document.getElementById("hotel-add-btn").classList.toggle("hidden", myHotels.length > 0);

    if (!myHotels.length) {
      body.innerHTML =
        '<tr><td colspan="5" class="text-muted">You have not registered your hotel yet. Click "+ Add hotel" to create it.</td></tr>';
      return;
    }

    body.innerHTML = myHotels
      .map(
        (h) => `
        <tr>
          <td>
            <div class="hotel-cell">
              ${h.images && h.images[0] ? `<img class="hotel-thumb" src="${escapeHtml(h.images[0])}" alt="" />` : '<div class="hotel-thumb"></div>'}
              <div>
                <strong>${escapeHtml(h.name)}</strong>
                <span class="cell-sub">${escapeHtml(h.location || "")}</span>
              </div>
            </div>
          </td>
          <td>${Utils.formatPrice(Number(h.price))}</td>
          <td>${Number(h.rating).toFixed(1)}★</td>
          <td>${badge(h.status, HOTEL_STATUS_LABEL)}</td>
          <td>
            <div class="actions">
              <button class="btn btn-outline btn-sm" data-edit="${h.id}">Edit</button>
              <button class="btn btn-danger btn-sm" data-delete="${h.id}">Delete</button>
            </div>
          </td>
        </tr>`
      )
      .join("");

    body.querySelectorAll("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () => openHotelForm(Number(btn.dataset.edit)))
    );
    body.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", () => deleteHotel(Number(btn.dataset.delete)))
    );
  } catch (err) {
    body.innerHTML = `<tr><td colspan="5" class="form-error">${escapeHtml(err.message)}</td></tr>`;
  }
}

function initHotelForm() {
  document.getElementById("hotel-add-btn").addEventListener("click", () => openHotelForm(null));
  document.getElementById("hotel-cancel-btn").addEventListener("click", closeHotelForm);
  document.getElementById("hotel-form").addEventListener("submit", saveHotel);
}

// id = null → thêm mới; id có giá trị → sửa
function openHotelForm(id) {
  editingHotelId = id;
  const hotel = id ? myHotels.find((h) => h.id === id) : null;

  document.getElementById("hotel-form-title").textContent = hotel ? "Edit hotel" : "Add hotel";
  document.getElementById("hf-name").value = hotel ? hotel.name : "";
  document.getElementById("hf-location").value = hotel ? hotel.location || "" : "";
  document.getElementById("hf-price").value = hotel ? hotel.price : "";
  document.getElementById("hf-description").value = hotel ? hotel.description || "" : "";
  document.getElementById("hf-image1").value = hotel && hotel.images[0] ? hotel.images[0] : "";
  document.getElementById("hf-image2").value = hotel && hotel.images[1] ? hotel.images[1] : "";
  document.getElementById("hotel-form-error").textContent = "";

  const form = document.getElementById("hotel-form");
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("hf-name").focus();
}

function closeHotelForm() {
  editingHotelId = null;
  document.getElementById("hotel-form").classList.add("hidden");
}

async function saveHotel(e) {
  e.preventDefault();
  const errorEl = document.getElementById("hotel-form-error");
  const saveBtn = document.getElementById("hotel-save-btn");
  errorEl.textContent = "";

  const data = {
    name: document.getElementById("hf-name").value.trim(),
    location: document.getElementById("hf-location").value.trim(),
    price: Number(document.getElementById("hf-price").value),
    description: document.getElementById("hf-description").value.trim(),
    image1: document.getElementById("hf-image1").value.trim(),
    image2: document.getElementById("hf-image2").value.trim(),
  };

  if (!data.name || !data.price || data.price <= 0) {
    errorEl.textContent = "Please enter the hotel name and a price greater than 0.";
    return;
  }

  if (editingHotelId) {
    const wasApproved = myHotels.find((h) => h.id === editingHotelId)?.status === "approved";
    if (wasApproved && !confirm("After editing, this hotel will be hidden until an admin approves it again. Continue?")) {
      return;
    }
  }

  saveBtn.disabled = true;
  try {
    if (editingHotelId) await Api.owner.updateHotel(editingHotelId, data);
    else await Api.owner.createHotel(data);

    Utils.toast(editingHotelId ? "Hotel updated. Waiting for admin approval." : "Hotel added. Waiting for admin approval.", "success");
    closeHotelForm();
    await loadHotels();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    saveBtn.disabled = false;
  }
}

async function deleteHotel(id) {
  const hotel = myHotels.find((h) => h.id === id);
  if (!confirm(`Delete "${hotel ? hotel.name : "this hotel"}"?`)) return;

  try {
    await Api.owner.deleteHotel(id);
    Utils.toast("Hotel deleted.", "success");
    await loadHotels();
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}

// ================== BOOKING ==================

async function loadBookings(status) {
  const body = document.getElementById("booking-table-body");
  body.innerHTML = '<tr><td colspan="7" class="text-muted">Loading...</td></tr>';

  try {
    const bookings = await Api.owner.bookings(status);
    const today = new Date().toISOString().slice(0, 10);

    if (!bookings.length) {
      body.innerHTML = '<tr><td colspan="7" class="text-muted">No bookings.</td></tr>';
      return;
    }

    body.innerHTML = bookings
      .map((b) => {
        let actions = "";
        if (b.status === "pending") {
          actions = `
            <button class="btn btn-gold btn-sm" data-action="confirm" data-id="${b.id}">Confirm</button>
            <button class="btn btn-danger btn-sm" data-action="reject" data-id="${b.id}">Reject</button>`;
        } else if (b.status === "confirmed" && b.checkOut <= today) {
          actions = `<button class="btn btn-outline btn-sm" data-action="complete" data-id="${b.id}">Mark completed</button>`;
        }

        return `
          <tr>
            <td>${b.id}</td>
            <td>${escapeHtml(b.hotelName)}</td>
            <td>${escapeHtml(b.guestName)}<span class="cell-sub">${escapeHtml(b.guestEmail)}</span></td>
            <td>${b.checkIn} → ${b.checkOut}<span class="cell-sub">${b.nights} night(s), ${b.guests} guest(s)</span></td>
            <td>${Utils.formatPrice(Number(b.total))}</td>
            <td>${badge(b.status, BOOKING_STATUS_LABEL)}</td>
            <td><div class="actions">${actions || '<span class="text-muted">—</span>'}</div></td>
          </tr>`;
      })
      .join("");

    body.querySelectorAll("[data-action]").forEach((btn) =>
      btn.addEventListener("click", () => handleBookingAction(btn.dataset.action, Number(btn.dataset.id)))
    );
  } catch (err) {
    body.innerHTML = `<tr><td colspan="7" class="form-error">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function handleBookingAction(action, id) {
  if (action === "reject" && !confirm("Reject this booking?")) return;

  try {
    if (action === "confirm") await Api.owner.confirmBooking(id);
    else if (action === "reject") await Api.owner.rejectBooking(id);
    else if (action === "complete") await Api.owner.completeBooking(id);

    const done = { confirm: "Booking confirmed.", reject: "Booking rejected.", complete: "Booking completed." };
    Utils.toast(done[action], "success");
    await loadBookings(document.getElementById("booking-filter").value);
  } catch (err) {
    Utils.toast(err.message, "error");
  }
}
