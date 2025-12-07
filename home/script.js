/*document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "home");
  initHomePage();
});

function initHomePage() {
  const featuredContainer = document.getElementById("home-hotel-list");
  const allHotels = window.HOTELS || [];
  const hotels = allHotels.slice(0, 4);

  // === there is no data here ===
  if (!allHotels.length) {
    featuredContainer.innerHTML =
      '<p class="text-muted">No hotel data loaded yet. Connect your frontend to a real API to display hotels here.</p>';
    return;
  }

  Render.renderHotelGrid(hotels, featuredContainer).then(() => {
    setupHotelCardEvents(featuredContainer);
  });

  const searchForm = document.getElementById("home-search-form");
  const searchInput = document.getElementById("home-search-input");

  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const q = searchInput.value || "";
      Router.goToSearch(q);
    });
  }
}


function setupHotelCardEvents(container) {
  container.addEventListener("click", function (e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const card = target.closest(".hotel-card");
    if (!card) return;

    const id = card.getAttribute("data-hotel-id");
    if (!id) return;

    if (target.classList.contains("btn-view-detail")) {
      Router.goToHotelDetail(id);
    } else if (target.classList.contains("btn-book-now")) {
      Router.goToBooking(id);
    }
  });
}
*/
// /home/script.js
document.addEventListener("DOMContentLoaded", () => {
  // header/footer + dark mode… nếu bạn đang dùng
  if (window.Render && Render.initSharedLayout) {
    Render.initSharedLayout("../shared", "home");
  }
  initHomePage();
});

async function initHomePage() {
  const featuredContainer = document.getElementById("home-hotel-list");
  const searchForm = document.getElementById("home-search-form");
  const searchInput = document.getElementById("home-search-input");

  if (!featuredContainer) {
    console.warn("Không tìm thấy #home-hotel-list");
    return;
  }

  featuredContainer.innerHTML = `<p class="text-muted">Loading hotels...</p>`;

  try {
    // LẤY DATA TỪ BACKEND (MySQL)
    const hotels = await Api.fetchHotels();

    if (!hotels.length) {
      featuredContainer.innerHTML =
        `<p class="text-muted">No hotels in database.</p>`;
      return;
    }

    // Featured: lấy 4 hotel đầu
    const featured = hotels.slice(0, 4);

    // Nếu bạn có Render.renderHotelGrid thì dùng, không thì fallback tự render
    if (window.Render && typeof Render.renderHotelGrid === "function") {
      await Render.renderHotelGrid(featured, featuredContainer);
    } else {
      featuredContainer.innerHTML = featured
        .map(
          (h) => `
          <article class="hotel-card" data-hotel-id="${h.id}">
            <div class="hotel-card-image">
              <img src="${(h.images && h.images[0]) || ""}" alt="${h.name}">
            </div>
            <div class="hotel-card-body">
              <h3>${h.name}</h3>
              <p class="hotel-location">${h.location}</p>
              <p class="hotel-price">${h.price.toLocaleString()} VND / night</p>
              <p class="hotel-rating">⭐ ${h.rating}</p>
              <button class="btn-primary view-detail" data-hotel-id="${h.id}">
                View details
              </button>
            </div>
          </article>`
        )
        .join("");
    }

    // Click card hoặc nút "View details" -> sang trang hotel-detail
    featuredContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-hotel-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-hotel-id");
      window.location.href = `../hotel-detail/index.html?id=${encodeURIComponent(
        id
      )}`;
    });
  } catch (err) {
    console.error("Lỗi khi load hotels ở home:", err);
    featuredContainer.innerHTML =
      `<p class="text-muted">Failed to load hotels from server.</p>`;
  }

  // Search -> chuyển sang trang /search/ với query
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (!q) return;
      // Nếu có Router.goToSearch thì dùng, không thì dùng query string
      if (window.Router && typeof Router.goToSearch === "function") {
        Router.goToSearch(q);
      } else {
        window.location.href = `../search/index.html?q=${encodeURIComponent(q)}`;
      }
    });
  }
}


