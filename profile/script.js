document.addEventListener("DOMContentLoaded", function () {
  if (window.Render && Render.initSharedLayout) {
    Render.initSharedLayout("../shared", "profile");
  }
  initProfilePage();
  loadProfileBookings();
});

function initProfilePage() {
  const user =
    window.Utils && typeof Utils.getCurrentUser === "function"
      ? Utils.getCurrentUser()
      : null;

  const userInfoEl = document.getElementById("profile-user-info");
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
      logoutBtn.classList.remove("hidden");
      logoutBtn.addEventListener("click", function () {
        if (window.Utils && typeof Utils.logoutCurrentUser === "function") {
          Utils.logoutCurrentUser();
        } else {
          localStorage.removeItem("current_user");
        }
        if (window.Router && typeof Router.goToHome === "function") {
          Router.goToHome();
        } else {
          window.location.href = "../home/index.html";
        }
      });
    }
  }
}

async function loadProfileBookings() {
  const bookingListEl = document.getElementById("profile-booking-list");
  if (!bookingListEl) return;

  // 🔐 Nếu chưa login thì không gọi API luôn
  const user =
    window.Utils && typeof Utils.getCurrentUser === "function"
      ? Utils.getCurrentUser()
      : null;

  if (!user) {
    bookingListEl.innerHTML =
      'Please login to see your bookings. Go to <a href="../login/index.html">Login</a>.';
    return;
  }

  try {
    const bookings = await Api.fetchMyBookings(); // bây giờ KHÔNG ném lỗi “User is not logged in” nữa

    console.log("bookings from API:", bookings);

    if (!bookings || bookings.length === 0) {
      bookingListEl.innerHTML =
        '<p class="text-muted">You have no bookings yet. Start exploring from <a href="../home/index.html">Home</a>.</p>';
      return;
    }

    bookingListEl.innerHTML = bookings
      .slice()
      .reverse()
      .map(function (b) {
        const hotelName = b.hotel_name || b.hotelName || "Unknown hotel";
        const location = b.hotel_location || b.location || "";
        const checkIn = b.check_in || b.checkIn || "";
        const checkOut = b.check_out || b.checkOut || "";
        const nights = b.nights ?? b.num_nights ?? "?";
        const guests = b.guests ?? b.num_guests ?? "?";
        const total = b.total ?? b.totalPrice ?? 0;

        const totalText =
          window.Utils && typeof Utils.formatPrice === "function"
            ? Utils.formatPrice(total)
            : total.toLocaleString() + " đ";

        return `
          <div class="profile-booking-item">
            <div><strong>${hotelName}</strong>${
          location ? " — " + location : ""
        }</div>
            <div class="profile-booking-meta">
              ${checkIn} → ${checkOut} • ${nights} night(s), ${guests} guest(s) • ${totalText}
            </div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Error loading bookings:", err);
    bookingListEl.innerHTML =
      '<p class="text-danger">Failed to load bookings. Please try again later.</p>';
  }
}
