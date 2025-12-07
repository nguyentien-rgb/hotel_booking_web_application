/*document.addEventListener("DOMContentLoaded", function () {
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
  const listEl = document.getElementById("search-results-list");
  const metaEl = document.getElementById("search-results-meta");

  // === there is no data here ===
  if (!hotels.length) {
    if (metaEl) {
      metaEl.textContent =
        "No hotel data loaded. Connect this page to your backend API to fetch real hotels.";
    }
    if (listEl) {
      listEl.innerHTML = "";
    }
    return;
  }

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
*/
// /search/script.js
// /search/script.js

// Lưu toàn bộ hotel lấy từ backend để tái dùng
let SEARCH_HOTELS = [];

document.addEventListener("DOMContentLoaded", function () {
  // Layout chung (header/footer, dark mode...)
  if (window.Render && Render.initSharedLayout) {
    Render.initSharedLayout("../shared", "search");
  }
  initSearchPage();
});

async function initSearchPage() {
  // 1. Load component: search-bar + filter-sidebar
  await loadSearchBar();
  await loadFilterSidebar();

  // 2. Lấy dữ liệu hotel từ backend (MySQL qua Node)
  try {
    SEARCH_HOTELS = await Api.fetchHotels(); // 🔥 thay cho window.HOTELS fake
  } catch (err) {
    console.error("Lỗi khi load hotels cho search:", err);
    const metaEl = document.getElementById("search-results-meta");
    const listEl = document.getElementById("search-results-list");
    if (metaEl) {
      metaEl.textContent = "Failed to load hotels from server.";
    }
    if (listEl) {
      listEl.innerHTML = "";
    }
    return;
  }

  // 3. Set từ khóa ban đầu từ ?q=... nếu có
  const initialQuery =
    (window.Utils && Utils.getQueryParam
      ? Utils.getQueryParam("q")
      : new URLSearchParams(window.location.search).get("q")) || "";

  const nameInput = document.getElementById("search-name");
  if (nameInput) nameInput.value = initialQuery;

  // 4. Render kết quả lần đầu & gắn event
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
    })
    .catch((err) => {
      console.error("Lỗi load search-bar.html:", err);
    });
}

function loadFilterSidebar() {
  const root = document.getElementById("filter-sidebar-root");
  if (!root) return Promise.resolve();
  return fetch("../shared/components/filter-sidebar.html")
    .then((r) => r.text())
    .then((html) => {
      root.innerHTML = html;
    })
    .catch((err) => {
      console.error("Lỗi load filter-sidebar.html:", err);
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
      [
        "filter-location",
        "filter-min-price",
        "filter-max-price",
        "filter-rating",
        "filter-sort",
      ].forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === "SELECT") el.value = "";
        else el.value = "";
      });
      performSearch();
    });
  }
}

function performSearch() {
  const hotels = SEARCH_HOTELS || []; // 🔥 dùng data thật từ backend
  const listEl = document.getElementById("search-results-list");
  const metaEl = document.getElementById("search-results-meta");

  if (!listEl || !metaEl) {
    console.warn("Thiếu #search-results-list hoặc #search-results-meta");
    return;
  }

  // === Không có data từ backend ===
  if (!hotels.length) {
    metaEl.textContent =
      "No hotel data loaded. Please check database or backend API.";
    listEl.innerHTML = "";
    return;
  }

  const name = (document.getElementById("search-name")?.value || "")
    .toLowerCase();
  const searchLocation =
    document.getElementById("search-location")?.value || "";

  const fLocation = document.getElementById("filter-location")?.value || "";
  const minPriceStr =
    document.getElementById("filter-min-price")?.value || "";
  const maxPriceStr =
    document.getElementById("filter-max-price")?.value || "";
  const ratingStr = document.getElementById("filter-rating")?.value || "";
  const sortBy = document.getElementById("filter-sort")?.value || "";

  let results = hotels.slice();

  // Lọc theo tên
  if (name) {
    results = results.filter((h) =>
      (h.name || "").toLowerCase().includes(name)
    );
  }

  // Lọc theo địa điểm: ưu tiên ô search-location, sau đó filter-location
  const finalLocation = searchLocation || fLocation;
  if (finalLocation) {
    results = results.filter((h) => h.location === finalLocation);
  }

  // Lọc theo price
  const minPrice = minPriceStr ? Number(minPriceStr) : null;
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : null;

  if (minPrice !== null && !isNaN(minPrice)) {
    results = results.filter((h) => Number(h.price) >= minPrice);
  }
  if (maxPrice !== null && !isNaN(maxPrice)) {
    results = results.filter((h) => Number(h.price) <= maxPrice);
  }

  // Lọc theo rating
  const rating = ratingStr ? Number(ratingStr) : null;
  if (rating !== null && !isNaN(rating)) {
    results = results.filter((h) => Number(h.rating) >= rating);
  }

  // Sort
  if (sortBy === "price-asc") {
    results.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    results.sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating-desc") {
    results.sort((a, b) => b.rating - a.rating);
  }

  // Meta text
  if (!results.length) {
    metaEl.textContent =
      "No hotels match your criteria. Try adjusting filters.";
  } else {
    metaEl.textContent =
      results.length + " luxury stays found for your search.";
  }

  // Render grid + gắn event trên card
  Render.renderHotelGrid(results, listEl).then(function () {
    setupResultCardEvents(listEl);
  });
}

function setupResultCardEvents(container) {
  if (!container) return;

  container.addEventListener("click", function (e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const card = target.closest(".hotel-card");
    if (!card) return;

    const id = card.getAttribute("data-hotel-id");
    if (!id) return;

    if (target.classList.contains("btn-view-detail")) {
      // sang hotel detail
      if (window.Router && typeof Router.goToHotelDetail === "function") {
        Router.goToHotelDetail(id);
      } else {
        window.location.href =
          "../hotel-detail/index.html?id=" + encodeURIComponent(id);
      }
    } else if (target.classList.contains("btn-book-now")) {
      // sang booking
      if (window.Router && typeof Router.goToBooking === "function") {
        Router.goToBooking(id);
      } else {
        window.location.href =
          "../booking/index.html?id=" + encodeURIComponent(id);
      }
    }
  });
}
