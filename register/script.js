// register/script.js
document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo header/footer, dark mode...
  Render.initSharedLayout("../shared", "");
  initRegisterPage();
});

function initRegisterPage() {
  const form = document.getElementById("register-form");
  const errorEl = document.getElementById("register-error");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    // Check đơn giản
    if (!name || !email || !password) {
      errorEl.textContent = "Please fill all fields.";
      return;
    }

    try {
      // POST /api/auth/register → { token, user }
      const data = await Api.registerUser({ name, email, password });

      // Lưu user kèm token; Api gửi token này trong header Authorization
      Utils.setCurrentUser({ ...data.user, token: data.token });

      // Điều hướng sang trang profile
      Router.goToProfile();
    } catch (err) {
      console.error("Register error:", err);
      errorEl.textContent = err.message || "Network error. Please try again.";
    }
  });
}
