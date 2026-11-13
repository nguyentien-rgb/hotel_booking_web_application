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
  const API_BASE_URL = "http://localhost:4000/api"; // backend .NET (HotelBooking)

  // Header gửi kèm JWT (token lưu chung trong object user ở localStorage)
  function authHeaders() {
    const user = getCurrentUser();
    const headers = { "Content-Type": "application/json" };
    if (user && user.token) headers.Authorization = "Bearer " + user.token;
    return headers;
  }

  // Đọc lỗi { message } từ server; 401 = token hết hạn/không có → đăng xuất
  async function handleError(res, fallback) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      Utils.logoutCurrentUser();
      throw new Error("Your session has expired. Please login again.");
    }
    throw new Error(err.message || fallback);
  }

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
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to create booking");
    return res.json(); // { success, bookingId, nights, total }
  }

  // Lấy danh sách booking của current user
  async function fetchMyBookings() {
    // Server biết user qua JWT, không gửi userId
    const res = await fetch(API_BASE_URL + "/bookings", {
      headers: authHeaders(),
    });
    if (!res.ok) await handleError(res, "Failed to fetch bookings");
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

    // data = { token, user: { id, name, email, role } }
    return data;
  }

  async function registerUser({ name, email, password }) {
    const res = await fetch(API_BASE_URL + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Register failed.");
    }

    // data = { token, user: { id, name, email, role } }
    return data;
  }

  // Expose global
  window.Api = {
    fetchHotels,
    fetchHotelById,
    createBooking,
    fetchMyBookings,
    loginUser,
    registerUser,
  };
})();
