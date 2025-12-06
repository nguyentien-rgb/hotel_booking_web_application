(function () {
  const Render = {};
  let sharedBasePath = "../shared";
  let hotelCardTemplate = null;

  function setSharedBase(base) {
    sharedBasePath = base || "../shared";
  }

  function initSharedLayout(basePath, activeNavKey) {
    setSharedBase(basePath);
    Theme.applySavedTheme();
    loadHeader(activeNavKey);
    loadFooter();
  }

  function loadHeader(activeNavKey) {
    const container = document.getElementById("app-header");
    if (!container) return;

    fetch(sharedBasePath + "/components/header.html")
      .then((res) => res.text())
      .then((html) => {
        container.innerHTML = html;
        setupHeader(activeNavKey);
      })
      .catch((err) => console.error("Error loading header:", err));
  }

  function setupHeader(activeNavKey) {
    const navLinks = document.querySelectorAll(".main-nav a[data-nav]");
    navLinks.forEach((link) => {
      if (link.getAttribute("data-nav") === activeNavKey) {
        link.classList.add("active");
      }
    });

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      function syncIcon() {
        const isDark = document.body.classList.contains("dark-theme");
        toggleBtn.textContent = isDark ? "☀️" : "🌙";
      }
      syncIcon();
      toggleBtn.addEventListener("click", function () {
        Theme.toggleTheme();
        syncIcon();
      });
    }

    // header auth UI (simple)
    const user = Utils.getCurrentUser();
    const loginLink = document.getElementById("header-login-link");
    const registerLink = document.getElementById("header-register-link");
    const userBtn = document.getElementById("header-user-btn");

    if (user) {
      if (loginLink) loginLink.classList.add("hidden");
      if (registerLink) registerLink.classList.add("hidden");
      if (userBtn) {
        userBtn.classList.remove("hidden");
        const firstName = user.name ? user.name.split(" ")[0] : "Guest";
        userBtn.textContent = "Hi, " + firstName;
        userBtn.addEventListener("click", function () {
          Router.goToProfile();
        });
      }
    } else {
      if (loginLink) loginLink.classList.remove("hidden");
      if (registerLink) registerLink.classList.remove("hidden");
      if (userBtn) userBtn.classList.add("hidden");
    }
  }

  function loadFooter() {
    const container = document.getElementById("app-footer");
    if (!container) return;

    fetch(sharedBasePath + "/components/footer.html")
      .then((res) => res.text())
      .then((html) => {
        container.innerHTML = html;
      })
      .catch((err) => console.error("Error loading footer:", err));
  }

  function loadHotelCardTemplate() {
    if (hotelCardTemplate) {
      return Promise.resolve(hotelCardTemplate);
    }
    return fetch(sharedBasePath + "/components/hotel-card.html")
      .then((res) => res.text())
      .then((tpl) => {
        hotelCardTemplate = tpl;
        return tpl;
      });
  }

  async function renderHotelGrid(hotels, container) {
    if (!container) return;
    const tpl = await loadHotelCardTemplate();
    container.innerHTML = "";

    hotels.forEach((hotel) => {
      let cardHtml = tpl
        .replace(/{{id}}/g, String(hotel.id))
        .replace(/{{image}}/g, hotel.images && hotel.images[0] ? hotel.images[0] : "")
        .replace(/{{name}}/g, hotel.name)
        .replace(/{{location}}/g, hotel.location)
        .replace(/{{rating}}/g, hotel.rating.toFixed(1))
        .replace(/{{price}}/g, Utils.formatPrice(hotel.price))
        .replace(
          /{{shortDescription}}/g,
          hotel.description ? hotel.description.slice(0, 70) + "…" : ""
        );

      container.insertAdjacentHTML("beforeend", cardHtml);
    });
  }

  Render.initSharedLayout = initSharedLayout;
  Render.renderHotelGrid = renderHotelGrid;

  window.Render = Render;
})();
