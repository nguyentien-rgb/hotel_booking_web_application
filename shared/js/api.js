// shared/js/api.js
(function () {
  const API_BASE_URL = "http://localhost:4000/api";

  async function fetchHotels() {
    const res = await fetch(API_BASE_URL + "/hotels");
    if (!res.ok) throw new Error("Failed to fetch hotels");
    const data = await res.json();
    // cho tiện, lưu global
    window.HOTELS = data;
    return data;
  }

  async function fetchHotelById(id) {
    const res = await fetch(API_BASE_URL + "/hotels/" + encodeURIComponent(id));
    if (!res.ok) throw new Error("Failed to fetch hotel detail");
    return res.json();
  }

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
    return res.json();
  }

  window.Api = { fetchHotels, fetchHotelById, createBooking };
})();
