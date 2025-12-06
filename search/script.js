document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "search");
  initSearchPage();
});

async function initSearchPage() {
  await loadSearchBar();
  await loadFilterSidebar();
  const initialQuery = Utils.getQueryParam("q") || "";
  const nameInput = document.getElementById("search-name");
  if (nameInput) nameInput.value = initialQuery;

  performSearch();
  setupEventHandlers();
}

function loadSearchBar() {
  const root = document.getElementById("search-bar-root");
  if (!root) return Promise.resolve();
  return fetch("../shared/components/search-bar.html")
    .then((r) => r.text())
    .then((html) => {
      root.innerHTML = html;
    });
}

function loadFilterSidebar() {
  const root = document.getElementById("filter-sidebar-root");
  if (!root) return Promise.resolve();
  return fetch("../shared/components/filter-sidebar.html")
    .then((r) => r.text())
    .then((html) => {
      root.innerHTML = html;
    });
}

function setupEventHandlers() {
  const searchForm = document.getElementById("search-bar-form");
  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      performSearch();
    });
  }

  const applyBtn = document.getElementById("filter-apply-btn");
  const resetBtn = document.getElementById("filter-reset-btn");

  if (applyBtn) {
    applyBtn.addEventListener("click", performSearch);
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      ["filter-location", "filter-min-price", "filter-max-price", "filter-rating", "filter-sort"].forEach(
        function (id) {
          const el = document.getElementById(id);
          if (!el) return;
          if (el.tagName === "SELECT") el.value = "";
          else el.value = "";
        }
      );
      performSearch();
    });
  }
}

function performSearch() {
  const hotels = window.HOTELS || [];
  const name = (document.getElementById("search-name")?.value || "").toLowerCase();
  const searchLocation = document.getElementById("search-location")?.value || "";

  const fLocation = document.getElementById("filter-location")?.value || "";
  const minPriceStr = document.getElementById("filter-min-price")?.value || "";
  const maxPriceStr = document.getElementById("filter-max-price")?.value || "";
  const ratingStr = document.getElementById("filter-rating")?.value || "";
  const sortBy = document.getElementById("filter-sort")?.value || "";

  let results = hotels.slice();

  if (name) {
    results = results.filter((h) => h.name.toLowerCase().includes(name));
  }

  const finalLocation = searchLocation || fLocation;
  if (finalLocation) {
    results = results.filter((h) => h.location === finalLocation);
  }

  const minPrice = minPriceStr ? Number(minPriceStr) : null;
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : null;

  if (minPrice !== null && !isNaN(minPrice)) {
    results = results.filter((h) => h.price >= minPrice);
  }
  if (maxPrice !== null && !isNaN(maxPrice)) {
    results = results.filter((h) => h.price <= maxPrice);
  }

  const rating = ratingStr ? Number(ratingStr) : null;
  if (rating !== null && !isNaN(rating)) {
    results = results.filter((h) => h.rating >= rating);
  }

  if (sortBy === "price-asc") {
    results.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    results.sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating-desc") {
    results.sort((a, b) => b.rating - a.rating);
  }

  const metaEl = document.getElementById("search-results-meta");
  if (metaEl) {
    if (!results.length) {
      metaEl.textContent = "No hotels match your criteria. Try adjusting filters.";
    } else {
      metaEl.textContent = results.length + " luxury stays found for your search.";
    }
  }

  const listEl = document.getElementById("search-results-list");
  Render.renderHotelGrid(results, listEl).then(function () {
    setupResultCardEvents(listEl);
  });
}

function setupResultCardEvents(container) {
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
