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
      // POST /api/auth/login → { token, user }
      const data = await Api.loginUser({ email, password });

      // Lưu user kèm token; Api gửi token này trong header Authorization
      Utils.setCurrentUser({ ...data.user, token: data.token });

      // Điều hướng sang trang profile
      Router.goToProfile();
    } catch (err) {
      console.error("Login error:", err);
      errorEl.textContent =
        err.message || "Invalid email or password (mock authentication).";
    }
  });
}
