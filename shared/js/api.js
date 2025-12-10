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
(function () {
  const API_BASE_URL = "http://localhost:4000/api";

  // ==== Helper: lấy current_user ==== //
  // Ưu tiên dùng Utils.getCurrentUser nếu có,
  // nếu không thì đọc trực tiếp từ localStorage.
  function getCurrentUser() {
    // Nếu Utils có sẵn hàm thì dùng luôn
    if (window.Utils && typeof Utils.getCurrentUser === "function") {
      try {
        return Utils.getCurrentUser();
      } catch (e) {
        console.warn("Utils.getCurrentUser() lỗi, fallback localStorage:", e);
      }
    }

    // Fallback: tự đọc localStorage
    try {
      const raw = localStorage.getItem("current_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("Không parse được current_user từ localStorage:", e);
      return null;
    }
  }

  // Lấy userId gửi lên backend (ở đây dùng EMAIL cho chắc)
  function getCurrentUserId() {
    const user = getCurrentUser();
    if (!user) return null;

    // dùng email làm khóa chính cho booking
    if (user.email) return user.email;

    // nếu sau này có id thì vẫn hỗ trợ
    return user.id || user.userId || user.StudentID || null;
  }

  // ==== HOTELS ==== //
  async function fetchHotels() {
    const res = await fetch(API_BASE_URL + "/hotels");
    if (!res.ok) throw new Error("Failed to fetch hotels");
    const data = await res.json();
    // cache tạm cho các trang khác dùng
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

  // ==== BOOKINGS ==== //

  // Tạo booking mới (được gọi ở trang Payment)
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

  // Lấy booking của user đang login để hiển thị ở Profile
  async function fetchMyBookings() {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error("User is not logged in");
    }

    const url =
      API_BASE_URL + "/bookings?userId=" + encodeURIComponent(userId);
    console.log("📡 fetchMyBookings url =", url);

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("❌ fetchMyBookings failed", res.status, text);
      throw new Error("Failed to fetch bookings");
    }

    return res.json();
  }

  // Gắn ra global
  window.Api = {
    fetchHotels,
    fetchHotelById,
    createBooking,
    fetchMyBookings,
  };
})();
