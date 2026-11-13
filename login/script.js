// login/script.js
document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "");
  initLoginPage();
});

function initLoginPage() {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");
  if (!form) return;

  const next = new URLSearchParams(window.location.search).get("next");

  // Bị chuyển sang đây vì bấm "Book now" khi chưa đăng nhập → báo cho khách biết
  if (next) {
    const notice = document.createElement("p");
    notice.className = "login-notice";
    notice.textContent = "Please login to continue your booking.";
    form.parentNode.insertBefore(notice, form);

    // Link "Create an account" giữ lại ?next= để đăng ký xong cũng quay lại đặt phòng
    const registerLink = form.querySelector('a[href*="register"]');
    if (registerLink) {
      registerLink.href = "../register/index.html?next=" + encodeURIComponent(next);
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      errorEl.textContent = "Please enter both email and password.";
      return;
    }

    try {
      // POST /api/auth/login → { token, user: { id, name, email, role } }
      const data = await Api.loginUser({ email, password });
      Utils.setCurrentUser({ ...data.user, token: data.token });

      // admin → trang admin, owner → trang owner,
      // customer → quay lại trang đặt phòng (nếu có ?next=) hoặc trang chủ
      Router.goAfterLogin(data.user);
    } catch (err) {
      console.error("Login error:", err);
      errorEl.textContent = err.message || "Login failed.";
    }
  });
}
