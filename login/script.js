// login/script.js
document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "");
  initLoginPage();
});

function initLoginPage() {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");

  if (!form) {
    console.warn("Login form not found.");
    return;
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
      // Gọi backend thật thay vì Utils.loadUsers()
      // POST http://localhost:4000/api/auth/login
      const data = await Api.loginUser({ email, password });
      const user = data.user; // { id, name, email }

      // Lưu user hiện tại để FE biết là đang đăng nhập
      if (window.Utils && typeof Utils.setCurrentUser === "function") {
        Utils.setCurrentUser(user);
      } else {
        // fallback nếu Utils chưa sẵn sàng
        localStorage.setItem("current_user", JSON.stringify(user));
      }

      // Điều hướng sang trang profile
      Router.goToProfile();
    } catch (err) {
      console.error("Login error:", err);
      errorEl.textContent =
        err.message || "Invalid email or password (mock authentication).";
    }
  });
}
