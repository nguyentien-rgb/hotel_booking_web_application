// register/script.js
document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "");
  initRegisterPage();
});

function initRegisterPage() {
  const form = document.getElementById("register-form");
  const errorEl = document.getElementById("register-error");
  if (!form) return;

  const next = new URLSearchParams(window.location.search).get("next");
  const roleSelect = document.getElementById("reg-role");

  const ownerFields = document.getElementById("owner-fields");

  // Đến từ nút "Book now" → mặc định là tài khoản khách hàng
  if (next && roleSelect) roleSelect.value = "customer";

  // Chọn "Hotel owner" thì hiện thêm ô thông tin chủ khách sạn
  function syncOwnerFields() {
    const isOwner = roleSelect && roleSelect.value === "owner";
    ownerFields.classList.toggle("hidden", !isOwner);
  }
  if (roleSelect) roleSelect.addEventListener("change", syncOwnerFields);
  syncOwnerFields();

  // Giữ ?next= cho link "Login"
  if (next) {
    const loginLink = form.querySelector('a[href*="login"]');
    if (loginLink) loginLink.href = "../login/index.html?next=" + encodeURIComponent(next);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const role = roleSelect ? roleSelect.value : "customer";
    const phone = document.getElementById("reg-phone").value.trim();

    if (!name || !email || !phone || !password) {
      errorEl.textContent = "Please fill all fields.";
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = "Password must be at least 6 characters.";
      return;
    }

    if (!/^[0-9+ ]{9,15}$/.test(phone)) {
      errorEl.textContent = "Please enter a valid phone number.";
      return;
    }

    let businessName, taxCode;
    if (role === "owner") {
      businessName = document.getElementById("reg-business").value.trim();
      taxCode = document.getElementById("reg-tax").value.trim();
      if (taxCode && !/^[0-9-]{10,14}$/.test(taxCode)) {
        errorEl.textContent = "Tax code must be 10–14 digits.";
        return;
      }
    }

    try {
      // POST /api/auth/register → { token, user } (đăng ký xong tự đăng nhập)
      const data = await Api.registerUser({ name, email, password, role, phone, businessName, taxCode });
      Utils.setCurrentUser({ ...data.user, token: data.token });

      Router.goAfterLogin(data.user);
    } catch (err) {
      console.error("Register error:", err);
      errorEl.textContent = err.message || "Register failed.";
    }
  });
}
