(function () {
  const STORAGE_KEYS = {
    THEME: "hb_theme",
    BOOKING_DRAFT: "hb_booking_draft",
    BOOKINGS: "hb_bookings",
    USERS: "hb_users",
    CURRENT_USER: "hb_current_user",
  };

  function formatPrice(amount) {
    if (typeof amount !== "number") return amount;
    return amount.toLocaleString("vi-VN") + " ₫";
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function calcNights(checkInStr, checkOutStr) {
    if (!checkInStr || !checkOutStr) return 0;
    const inDate = new Date(checkInStr);
    const outDate = new Date(checkOutStr);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return 0;
    const diff = outDate.getTime() - inDate.getTime();
    const nights = diff / (1000 * 60 * 60 * 24);
    return nights > 0 ? nights : 0;
  }

  function saveBookingDraft(draft) {
    localStorage.setItem(STORAGE_KEYS.BOOKING_DRAFT, JSON.stringify(draft));
  }

  function loadBookingDraft() {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKING_DRAFT);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearBookingDraft() {
    localStorage.removeItem(STORAGE_KEYS.BOOKING_DRAFT);
  }

  function saveCompletedBooking(booking) {
    const existing = loadCompletedBookings();
    existing.push(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(existing));
  }

  function loadCompletedBookings() {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  /* User (mock auth) */

  function loadUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  function logoutCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  /* Theme */

  function applySavedTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === "dark") {
      document.body.classList.add("dark-theme");
    } else if (saved === "light") {
      document.body.classList.remove("dark-theme");
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
  }

  window.Utils = {
    formatPrice,
    getQueryParam,
    calcNights,
    saveBookingDraft,
    loadBookingDraft,
    clearBookingDraft,
    saveCompletedBooking,
    loadCompletedBookings,
    loadUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    logoutCurrentUser,
  };

  window.Theme = {
    applySavedTheme,
    toggleTheme,
  };
})();
