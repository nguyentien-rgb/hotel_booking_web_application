// shared/js/router.js
// Chuyển trang + kiểm tra đăng nhập/vai trò ở phía giao diện.
// Lưu ý: bảo mật thật nằm ở backend ([Authorize]); phần này chỉ để điều hướng cho đúng.
(function () {
  const ROLE_HOME = {
    admin: "../admin/index.html",
    owner: "../owner/index.html",
    customer: "../home/index.html",
  };

  function currentUser() {
    return window.Utils && typeof Utils.getCurrentUser === "function"
      ? Utils.getCurrentUser()
      : null;
  }

  function go(url) {
    window.location.href = url;
  }

  function goToHome() {
    go("../home/index.html");
  }

  function goToSearch(query) {
    let url = "../search/index.html";
    if (query && query.trim()) url += "?q=" + encodeURIComponent(query.trim());
    go(url);
  }

  function goToHotelDetail(hotelId) {
    go("../hotel-detail/index.html?id=" + encodeURIComponent(hotelId));
  }

  // Khách vãng lai xem tự do, nhưng bấm "Book now" thì phải đăng nhập.
  // Đăng nhập xong sẽ quay lại đúng trang đặt phòng nhờ tham số ?next=
  function goToBooking(hotelId) {
    const url = "../booking/index.html?id=" + encodeURIComponent(hotelId);
    const user = currentUser();
    if (!user) {
      goToLogin(url);
      return;
    }
    if (user.role !== "customer") {
      Utils.toast("Only customer accounts can book rooms. Please log in with a customer account.", "error");
      return;
    }
    go(url);
  }

  function goToPayment() {
    go("../payment/index.html");
  }

  function goToProfile() {
    go("../profile/index.html");
  }

  // next: trang cần quay lại sau khi đăng nhập (tuỳ chọn)
  function goToLogin(next) {
    go("../login/index.html" + (next ? "?next=" + encodeURIComponent(next) : ""));
  }

  function goToRegister(next) {
    go("../register/index.html" + (next ? "?next=" + encodeURIComponent(next) : ""));
  }

  // Trang chính của từng vai trò
  function homeUrlFor(role) {
    return ROLE_HOME[role] || ROLE_HOME.customer;
  }

  // Sau khi đăng nhập/đăng ký: ưu tiên quay lại trang ?next= (chỉ với customer),
  // không có thì về trang chính theo vai trò.
  function goAfterLogin(user) {
    const next = new URLSearchParams(window.location.search).get("next");
    // chỉ chấp nhận đường dẫn nội bộ dạng ../xxx/... để tránh bị chuyển ra trang lạ
    const safeNext = next && /^\.\.\/[a-z-]+\/index\.html/.test(next) ? next : null;

    if (user.role === "customer" && safeNext) {
      go(safeNext);
    } else {
      go(homeUrlFor(user.role));
    }
  }

  // Chặn trang theo vai trò. Gọi ở đầu trang cần bảo vệ.
  // Chưa đăng nhập → sang login (kèm ?next=). Sai vai trò → về trang của vai trò đó.
  // Trả về user nếu hợp lệ, null nếu đã chuyển trang.
  function requireRole(roles) {
    const user = currentUser();
    if (!user || !user.token) {
      const here = "../" + window.location.pathname.split("/").slice(-2).join("/") + window.location.search;
      goToLogin(here);
      return null;
    }
    if (roles && roles.length && !roles.includes(user.role)) {
      go(homeUrlFor(user.role));
      return null;
    }
    return user;
  }

  function logout() {
    if (window.Utils && typeof Utils.logoutCurrentUser === "function") {
      Utils.logoutCurrentUser();
    }
    goToHome();
  }

  window.Router = {
    goToHome,
    goToSearch,
    goToHotelDetail,
    goToBooking,
    goToPayment,
    goToProfile,
    goToLogin,
    goToRegister,
    homeUrlFor,
    goAfterLogin,
    requireRole,
    logout,
  };
})();
