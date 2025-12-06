document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "");
  initRegisterPage();
});

function initRegisterPage() {
  const form = document.getElementById("register-form");
  const errorEl = document.getElementById("register-error");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!name || !email || !password) {
      errorEl.textContent = "Please fill all fields.";
      return;
    }

    const users = Utils.loadUsers();
    if (users.some((u) => u.email === email)) {
      errorEl.textContent = "Email already registered. Please login.";
      return;
    }

    users.push({ name, email, password });
    Utils.saveUsers(users);
    Utils.setCurrentUser({ name, email });
    Router.goToProfile();
  });
}
