document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "home");
  initHomePage();
});

function initHomePage() {
  const featuredContainer = document.getElementById("home-hotel-list");
  const hotels = (window.HOTELS || []).slice(0, 4);

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
