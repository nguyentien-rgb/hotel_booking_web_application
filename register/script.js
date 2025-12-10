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
      // Gọi trực tiếp backend (không cần bcrypt, mật khẩu demo)
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // message từ backend: { message: "..." }
        errorEl.textContent = data.message || "Register failed.";
        return;
      }

      // data.user = { id, name, email }
      const user = data.user;

      // Lưu user hiện tại để FE biết là đang đăng nhập
      if (window.Utils && typeof Utils.setCurrentUser === "function") {
        Utils.setCurrentUser(user);
      } else {
        // fallback nếu chưa có Utils.setCurrentUser
        localStorage.setItem("current_user", JSON.stringify(user));
      }

      // Điều hướng sang trang profile
      Router.goToProfile();
    } catch (err) {
      console.error("Register request error:", err);
      errorEl.textContent = "Network error. Please try again.";
    }
  });
}
