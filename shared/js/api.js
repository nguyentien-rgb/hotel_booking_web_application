// shared/js/api.js
// Mọi lời gọi tới backend ASP.NET Core Web API đều đi qua file này.
(function () {
  const API_BASE_URL = "http://localhost:4000/api";

  // User hiện tại lưu ở localStorage: { id, name, email, role, token }
  function getCurrentUser() {
    return window.Utils && typeof Utils.getCurrentUser === "function"
      ? Utils.getCurrentUser()
      : null;
  }

  // Hàm gọi API chung: tự gắn JWT, tự đọc lỗi { message } từ server
  async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";

    if (auth) {
      const user = getCurrentUser();
      if (!user || !user.token) throw new Error("Please login first.");
      headers.Authorization = "Bearer " + user.token;
    }

    let res;
    try {
      res = await fetch(API_BASE_URL + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error("Cannot connect to the server. Is the API running?");
    }

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && auth) {
      // Token hết hạn hoặc không hợp lệ → đăng xuất
      Utils.logoutCurrentUser();
      throw new Error("Your session has expired. Please login again.");
    }
    if (res.status === 403) {
      throw new Error(data.message || "You do not have permission to do this.");
    }
    if (!res.ok) {
      throw new Error(data.message || "Request failed (" + res.status + ").");
    }
    return data;
  }

  function qs(params) {
    const s = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return s ? "?" + s : "";
  }

  // ================== HOTELS (công khai) ==================

  async function fetchHotels() {
    const data = await request("/hotels");
    window.HOTELS = data;
    return data;
  }

  function fetchHotelById(id) {
    return request("/hotels/" + encodeURIComponent(id));
  }

  // ================== AUTH ==================

  // → { token, user: { id, name, email, role } }
  function loginUser({ email, password }) {
    return request("/auth/login", { method: "POST", body: { email, password } });
  }

  // Thông tin mới nhất của người đang đăng nhập → { id, name, email, role, phone }
  function fetchMe() {
    return request("/auth/me", { auth: true });
  }

  // role: "customer" hoặc "owner"; owner gửi thêm businessName, taxCode
  function registerUser({ name, email, password, role, phone, businessName, taxCode }) {
    return request("/auth/register", {
      method: "POST",
      body: { name, email, password, role, phone, businessName, taxCode },
    });
  }

  // ================== CUSTOMER ==================

  // payload: { hotelId, checkIn, checkOut, guests, paymentMethod }
  function createBooking(payload) {
    return request("/bookings", { method: "POST", body: payload, auth: true });
  }

  function fetchMyBookings() {
    return request("/bookings", { auth: true });
  }

  function cancelBooking(id) {
    return request("/bookings/" + id + "/cancel", { method: "PUT", auth: true });
  }

  // ================== OWNER ==================

  const owner = {
    profile: () => request("/owner/profile", { auth: true }),
    saveProfile: (data) => request("/owner/profile", { method: "PUT", body: data, auth: true }),
    hotels: () => request("/owner/hotels", { auth: true }),
    createHotel: (data) => request("/owner/hotels", { method: "POST", body: data, auth: true }),
    updateHotel: (id, data) =>
      request("/owner/hotels/" + id, { method: "PUT", body: data, auth: true }),
    deleteHotel: (id) => request("/owner/hotels/" + id, { method: "DELETE", auth: true }),
    bookings: (status) => request("/owner/bookings" + qs({ status }), { auth: true }),
    confirmBooking: (id) => request("/owner/bookings/" + id + "/confirm", { method: "PUT", auth: true }),
    rejectBooking: (id) => request("/owner/bookings/" + id + "/reject", { method: "PUT", auth: true }),
    cancelBooking: (id) => request("/owner/bookings/" + id + "/cancel", { method: "PUT", auth: true }),
    completeBooking: (id) =>
      request("/owner/bookings/" + id + "/complete", { method: "PUT", auth: true }),
  };

  // ================== ADMIN ==================

  const admin = {
    stats: () => request("/admin/stats", { auth: true }),
    hotels: (status) => request("/admin/hotels" + qs({ status }), { auth: true }),
    approveHotel: (id) => request("/admin/hotels/" + id + "/approve", { method: "PUT", auth: true }),
    rejectHotel: (id) => request("/admin/hotels/" + id + "/reject", { method: "PUT", auth: true }),
    users: (role) => request("/admin/users" + qs({ role }), { auth: true }),
    lockUser: (id) => request("/admin/users/" + id + "/lock", { method: "PUT", auth: true }),
    unlockUser: (id) => request("/admin/users/" + id + "/unlock", { method: "PUT", auth: true }),
    bookings: (status) => request("/admin/bookings" + qs({ status }), { auth: true }),
  };

  window.Api = {
    fetchHotels,
    fetchHotelById,
    loginUser,
    registerUser,
    fetchMe,
    createBooking,
    fetchMyBookings,
    cancelBooking,
    owner,
    admin,
  };
})();
