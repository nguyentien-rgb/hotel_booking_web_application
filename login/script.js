document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "");
  initLoginPage();
});

function initLoginPage() {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      errorEl.textContent = "Please enter both email and password.";
      return;
    }

    const users = Utils.loadUsers();
    const found = users.find((u) => u.email === email && u.password === password);

    if (!found) {
      errorEl.textContent = "Invalid email or password (mock authentication).";
      return;
    }

    Utils.setCurrentUser({ name: found.name, email: found.email });
    Router.goToProfile();
  });
}
