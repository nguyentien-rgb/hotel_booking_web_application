(function () {
  const Render = {};
  let sharedBasePath = "../shared";
  let hotelCardTemplate = null;

  function setSharedBase(base) {
    sharedBasePath = base || "../shared";
  }

  function initSharedLayout(basePath, activeNavKey) {
    setSharedBase(basePath);

    // Mọi ảnh trên trang bị lỗi tải → thay bằng ảnh xám "No image"
    document.addEventListener(
      "error",
      (e) => {
        const img = e.target;
        if (img && img.tagName === "IMG" && img.src !== IMAGE_PLACEHOLDER) {
          img.src = IMAGE_PLACEHOLDER;
        }
      },
      true
    );
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

    setupUserMenu(activeNavKey);
  }

  const ROLE_LABEL = { admin: "Administrator", owner: "Hotel owner", customer: "Customer" };
  const ROLE_PAGE_LABEL = { admin: "Admin dashboard", owner: "My hotel", customer: "My profile" };

  // Góc phải header: chưa đăng nhập → Login/Sign up; đã đăng nhập → menu tên người dùng
  function setupUserMenu(activeNavKey) {
    const user = Utils.getCurrentUser();
    const loginLink = document.getElementById("header-login-link");
    const registerLink = document.getElementById("header-register-link");
    const menu = document.getElementById("header-user-menu");

    if (!user) {
      if (loginLink) loginLink.classList.remove("hidden");
      if (registerLink) registerLink.classList.remove("hidden");
      if (menu) menu.classList.add("hidden");
      return;
    }

    if (loginLink) loginLink.classList.add("hidden");
    if (registerLink) registerLink.classList.add("hidden");

    // Owner/admin: link "Profile" trên thanh menu đổi thành trang quản lý của họ
    const profileNav = document.querySelector('.main-nav a[data-nav="profile"]');
    if (profileNav && (user.role === "owner" || user.role === "admin")) {
      profileNav.textContent = user.role === "owner" ? "My hotel" : "Admin";
      profileNav.href = Router.homeUrlFor(user.role);
      profileNav.setAttribute("data-nav", user.role);
      if (activeNavKey === user.role) profileNav.classList.add("active");
    }

    if (!menu) return;
    menu.classList.remove("hidden");

    const fullName = (user.name || "Guest").trim();
    const parts = fullName.split(/\s+/);
    const shortName = fullName.length <= 16 ? fullName : parts[parts.length - 1];

    document.getElementById("header-user-name").textContent = "Hi, " + shortName;
    document.getElementById("header-user-avatar").textContent = parts[parts.length - 1].charAt(0).toUpperCase();
    document.getElementById("user-menu-fullname").textContent = fullName;
    document.getElementById("user-menu-email").textContent = user.email || "";
    document.getElementById("user-menu-role").textContent = ROLE_LABEL[user.role] || user.role;

    const homeItem = document.getElementById("user-menu-home");
    homeItem.textContent = ROLE_PAGE_LABEL[user.role] || "My profile";
    homeItem.href = user.role === "customer" ? "../profile/index.html" : Router.homeUrlFor(user.role);

    document.getElementById("user-menu-logout").addEventListener("click", () => Router.logout());

    // Rê chuột thì CSS tự mở; bấm (điện thoại, bàn phím) thì bật/tắt bằng class "open"
    const trigger = document.getElementById("header-user-btn");
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        menu.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  function loadFooter() {
    const container = document.getElementById("app-footer");
    if (!container) return;

    fetch(sharedBasePath + "/components/footer.html")
      .then((res) => res.text())
      .then((html) => {
        container.innerHTML = html;
        const yearEl = document.getElementById("footer-year");
        if (yearEl) yearEl.textContent = new Date().getFullYear();
      })
      .catch((err) => console.error("Error loading footer:", err));
  }

  // Cắt mô tả theo từ, bỏ dấu câu cuối trước khi thêm "…"
  function shortText(text, max) {
    if (!text) return "";
    const t = String(text).trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!-]+$/, "") + "…";
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
      // Dữ liệu do owner nhập → luôn escape. Thay bằng callback để "$&", "$1"... trong tên không bị hiểu là mẫu.
      const values = {
        id: hotel.id,
        image: hotel.images && hotel.images[0] ? hotel.images[0] : "",
        name: hotel.name,
        location: hotel.location || "",
        rating: Number(hotel.rating || 0).toFixed(1),
        price: Utils.formatPrice(Number(hotel.price)),
        shortDescription: shortText(hotel.description, 80),
      };
      const cardHtml = tpl.replace(/{{(\w+)}}/g, (match, key) =>
        key in values ? Utils.escapeHtml(values[key]) : match
      );

      container.insertAdjacentHTML("beforeend", cardHtml);
    });

    attachImageFallback(container);
  }

  // Ảnh không tải được (link hỏng, mất mạng) → hiện ảnh xám thay vì chữ alt
  const IMAGE_PLACEHOLDER =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">' +
        '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
        '<text x="50%" y="50%" fill="#9ca3af" font-family="sans-serif" font-size="32" ' +
        'text-anchor="middle" dominant-baseline="middle">No image</text></svg>'
    );

  function attachImageFallback(root) {
    (root || document).querySelectorAll("img").forEach((img) => {
      img.addEventListener(
        "error",
        () => {
          img.src = IMAGE_PLACEHOLDER;
        },
        { once: true }
      );
      // ảnh đã lỗi trước khi gắn sự kiện
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
        img.src = IMAGE_PLACEHOLDER;
      }
    });
  }

  // Khung xám nhấp nháy trong lúc chờ dữ liệu
  function renderSkeleton(container, count) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count || 3 })
      .map(
        () => `
        <div class="hotel-card skeleton-card">
          <div class="skeleton skeleton-image"></div>
          <div class="hotel-card-body">
            <div class="skeleton skeleton-line" style="width:70%"></div>
            <div class="skeleton skeleton-line" style="width:90%"></div>
            <div class="skeleton skeleton-line" style="width:40%"></div>
          </div>
        </div>`
      )
      .join("");
  }

  Render.initSharedLayout = initSharedLayout;
  Render.renderHotelGrid = renderHotelGrid;
  Render.renderSkeleton = renderSkeleton;
  Render.attachImageFallback = attachImageFallback;

  window.Render = Render;
})();
