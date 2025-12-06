document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "profile");
  initProfilePage();
});

function initProfilePage() {
  const user = Utils.getCurrentUser();
  const userInfoEl = document.getElementById("profile-user-info");
  const bookingListEl = document.getElementById("profile-booking-list");
  const logoutBtn = document.getElementById("profile-logout-btn");

  if (!user) {
    userInfoEl.innerHTML =
      '<p class="text-muted">You are browsing as a guest. <a href="../login/index.html">Login</a> or <a href="../register/index.html">create an account</a>.</p>';
    if (logoutBtn) logoutBtn.classList.add("hidden");
  } else {
    userInfoEl.innerHTML = `
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        Utils.logoutCurrentUser();
        Router.goToHome();
      });
    }
  }

  const bookings = Utils.loadCompletedBookings();
  if (!bookings.length) {
    bookingListEl.innerHTML =
      '<p class="text-muted">You have no bookings yet. Start exploring from <a href="../home/index.html">Home</a>.</p>';
    return;
  }

  const hotels = window.HOTELS || [];
  bookingListEl.innerHTML = bookings
    .slice()
    .reverse()
    .map(function (b) {
      const hotel = hotels.find((h) => h.id === b.hotelId);
      const hotelName = hotel ? hotel.name : b.hotelName || "Unknown";
      return `
        <div class="profile-booking-item">
          <div><strong>${hotelName}</strong> — ${b.location}</div>
          <div class="profile-booking-meta">
            ${b.checkIn} → ${b.checkOut} • ${b.nights} night(s), ${b.guests} guest(s) • ${Utils.formatPrice(
        b.total
      )}
          </div>
          <div class="profile-booking-meta">
            Paid via ${b.method.toUpperCase()} at ${new Date(b.createdAt).toLocaleString()}
          </div>
        </div>
      `;
    })
    .join("");
}
