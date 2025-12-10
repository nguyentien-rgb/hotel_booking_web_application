/*
// shared/js/api.js
(function () {
  const API_BASE_URL = "http://localhost:4000/api";

  async function fetchHotels() {
    const res = await fetch(`${API_BASE_URL}/hotels`);
    if (!res.ok) throw new Error("Failed to load hotels");
    // Không set window.HOTELS nữa để tránh data fake
    // const data = await res.json();
    // window.HOTELS = data;
    // return data;
    return res.json();
  }

  async function fetchHotelById(id) {
    const res = await fetch(
      `${API_BASE_URL}/hotels/${encodeURIComponent(id)}`
    );
    if (!res.ok) throw new Error("Failed to load hotel");
    return res.json();
  }

  async function createBooking(payload) {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create booking");
    }
    return res.json();
  }

  // Expose global
  window.Api = { fetchHotels, fetchHotelById, createBooking };
})();
*/
// shared/js/api.js
// shared/js/api.js
(function () {
  const API_BASE_URL = "http://localhost:4000/api";

  // Dùng chung với Utils.getCurrentUser (key: "hb_current_user")
  function getCurrentUser() {
    // Nếu Utils đã load, ưu tiên dùng luôn cho đồng bộ
    if (window.Utils && typeof Utils.getCurrentUser === "function") {
      return Utils.getCurrentUser();
    }

    // Fallback: đọc trực tiếp localStorage
    try {
      const raw =
        localStorage.getItem("hb_current_user") || // đúng key hiện tại
        localStorage.getItem("current_user");      // key cũ (nếu còn)
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function getCurrentUserId() {
    const user = getCurrentUser();
    return user && user.id ? Number(user.id) : null;
  }

  // ================== HOTELS ==================

  async function fetchHotels() {
    const res = await fetch(API_BASE_URL + "/hotels");
    if (!res.ok) throw new Error("Failed to fetch hotels");
    const data = await res.json();
    // Lưu global nếu cần dùng chỗ khác
    window.HOTELS = data;
    return data;
  }

  async function fetchHotelById(id) {
    const res = await fetch(
      API_BASE_URL + "/hotels/" + encodeURIComponent(id)
    );
    if (!res.ok) throw new Error("Failed to fetch hotel detail");
    return res.json();
  }

  // ================== BOOKINGS ==================

  async function createBooking(payload) {
    const res = await fetch(API_BASE_URL + "/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create booking");
    }
    return res.json(); // { success, bookingId }
  }

  // Lấy danh sách booking của current user
  async function fetchMyBookings() {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error("User is not logged in");
    }

    const res = await fetch(
      API_BASE_URL + "/bookings?userId=" + encodeURIComponent(userId)
    );
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return res.json();
  }

  // ================== AUTH ==================

  // 🔐 Login: gọi POST /api/auth/login
  async function loginUser({ email, password }) {
    const res = await fetch(API_BASE_URL + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    // data.user = { id, name, email }
    return data;
  }

  // Expose global
  window.Api = {
    fetchHotels,
    fetchHotelById,
    createBooking,
    fetchMyBookings,
    loginUser,
  };
})();
