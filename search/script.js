// search/script.js — tìm kiếm và lọc khách sạn
// Tải danh sách 1 lần từ API, sau đó lọc ngay trên trình duyệt mỗi khi người dùng đổi bộ lọc.

let ALL_HOTELS = [];

document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "search");
  initSearchPage();
});

async function initSearchPage() {
  await Promise.all([
    loadComponent("search-bar-root", "../shared/components/search-bar.html"),
    loadComponent("filter-sidebar-root", "../shared/components/filter-sidebar.html"),
  ]);

  const listEl = document.getElementById("search-results-list");
  Render.renderSkeleton(listEl, 4);

  try {
    ALL_HOTELS = await Api.fetchHotels();
  } catch (err) {
    document.getElementById("search-results-meta").textContent = "";
    listEl.innerHTML = emptyState("⚠️", "Cannot load hotels", err.message, false);
    return;
  }

  fillDestinations(ALL_HOTELS);

  // Từ khoá truyền từ trang chủ: ?q=...
  const q = new URLSearchParams(window.location.search).get("q") || "";
  document.getElementById("search-query").value = q;

  setupEvents();
  applyFilters();
}

function loadComponent(rootId, url) {
  const root = document.getElementById(rootId);
  return fetch(url)
    .then((r) => r.text())
    .then((html) => {
      root.innerHTML = html;
    });
}

function fillDestinations(hotels) {
  const select = document.getElementById("filter-location");
  const locations = [...new Set(hotels.map((h) => h.location).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "vi")
  );
  locations.forEach((loc) => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    select.appendChild(opt);
  });
}

function setupEvents() {
  // Ô tìm kiếm: lọc ngay khi gõ, bấm Search thì cập nhật URL
  const form = document.getElementById("search-bar-form");
  const queryInput = document.getElementById("search-query");
  queryInput.addEventListener("input", applyFilters);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
  });

  // Mọi bộ lọc khác: đổi là lọc luôn, không cần nút Apply
  document.getElementById("filter-location").addEventListener("change", applyFilters);
  document.getElementById("filter-sort").addEventListener("change", applyFilters);
  document
    .querySelectorAll('#filter-sidebar input[type="radio"]')
    .forEach((r) => r.addEventListener("change", applyFilters));

  document.getElementById("filter-reset-btn").addEventListener("click", resetFilters);

  // Click trên thẻ khách sạn
  document.getElementById("search-results-list").addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === "empty-reset-btn") {
      resetFilters();
      return;
    }

    const card = target.closest(".hotel-card");
    const id = card && card.getAttribute("data-hotel-id");
    if (!id) return;

    if (target.classList.contains("btn-book-now")) Router.goToBooking(id);
    else Router.goToHotelDetail(id);
  });

  // Bấm "x" trên nhãn bộ lọc đang bật
  document.getElementById("active-filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-clear]");
    if (btn) clearFilter(btn.dataset.clear);
  });
}

function getFilters() {
  const checked = (name) => document.querySelector(`#filter-sidebar input[name="${name}"]:checked`);
  return {
    query: document.getElementById("search-query").value.trim(),
    location: document.getElementById("filter-location").value,
    price: checked("price") ? checked("price").value : "",
    rating: checked("rating") ? checked("rating").value : "",
    sort: document.getElementById("filter-sort").value,
  };
}

function applyFilters() {
  const f = getFilters();
  let results = ALL_HOTELS.slice();

  // Tìm theo tên, địa điểm, mô tả; không phân biệt hoa thường và dấu ("ha long" = "Hạ Long")
  if (f.query) {
    const words = Utils.normalizeText(f.query).split(/\s+/);
    results = results.filter((h) => {
      const text = Utils.normalizeText([h.name, h.location, h.description].join(" "));
      return words.every((w) => text.includes(w));
    });
  }

  if (f.location) {
    results = results.filter((h) => h.location === f.location);
  }

  if (f.price) {
    const [min, max] = f.price.split("-");
    if (min) results = results.filter((h) => Number(h.price) >= Number(min));
    if (max) results = results.filter((h) => Number(h.price) < Number(max));
  }

  if (f.rating) {
    results = results.filter((h) => Number(h.rating) >= Number(f.rating));
  }

  if (f.sort === "price-asc") results.sort((a, b) => a.price - b.price);
  else if (f.sort === "price-desc") results.sort((a, b) => b.price - a.price);
  else if (f.sort === "rating-desc") results.sort((a, b) => b.rating - a.rating);

  updateUrl(f.query);
  renderActiveFilters(f);
  renderResults(results);
}

function renderResults(results) {
  const listEl = document.getElementById("search-results-list");
  const metaEl = document.getElementById("search-results-meta");

  if (!results.length) {
    metaEl.textContent = "No hotels found";
    listEl.innerHTML = emptyState(
      "🏨",
      "No hotels match your search",
      "Try another destination or remove some filters.",
      true
    );
    return;
  }

  metaEl.textContent = results.length + (results.length === 1 ? " hotel found" : " hotels found");
  Render.renderHotelGrid(results, listEl);
}

const PRICE_LABEL = {
  "0-700000": "Under 700K",
  "700000-1000000": "700K – 1M",
  "1000000-": "Over 1M",
};

function renderActiveFilters(f) {
  const tags = [];
  if (f.query) tags.push(["query", `"${f.query}"`]);
  if (f.location) tags.push(["location", f.location]);
  if (f.price) tags.push(["price", PRICE_LABEL[f.price]]);
  if (f.rating) tags.push(["rating", f.rating + "★ +"]);

  const escape = (t) => {
    const d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  };

  document.getElementById("active-filters").innerHTML = tags
    .map(
      ([key, label]) =>
        `<span class="filter-tag">${escape(label)}<button type="button" data-clear="${key}" aria-label="Remove filter">×</button></span>`
    )
    .join("");
}

function clearFilter(key) {
  if (key === "query") document.getElementById("search-query").value = "";
  if (key === "location") document.getElementById("filter-location").value = "";
  if (key === "price" || key === "rating") {
    const any = document.querySelector(`#filter-sidebar input[name="${key}"][value=""]`);
    if (any) any.checked = true;
  }
  applyFilters();
}

function resetFilters() {
  ["query", "location", "price", "rating"].forEach((k) => {
    if (k === "query") document.getElementById("search-query").value = "";
    if (k === "location") document.getElementById("filter-location").value = "";
    if (k === "price" || k === "rating") {
      const any = document.querySelector(`#filter-sidebar input[name="${k}"][value=""]`);
      if (any) any.checked = true;
    }
  });
  document.getElementById("filter-sort").value = "";
  applyFilters();
}

// Giữ từ khoá trên URL để tải lại trang / gửi link vẫn giữ kết quả
function updateUrl(query) {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url);
}

function emptyState(icon, title, text, withReset) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${withReset ? '<button class="btn btn-outline" id="empty-reset-btn" type="button">Clear all filters</button>' : ""}
    </div>`;
}
