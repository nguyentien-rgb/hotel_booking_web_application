// home/script.js — trang chủ
document.addEventListener("DOMContentLoaded", () => {
  Render.initSharedLayout("../shared", "home");
  initSearchForm();
  loadFeaturedHotels();
});

// Ô tìm kiếm → sang trang Search kèm ?q=
function initSearchForm() {
  const form = document.getElementById("home-search-form");
  const input = document.getElementById("home-search-input");
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    Router.goToSearch(input.value);
  });
}

async function loadFeaturedHotels() {
  const listEl = document.getElementById("home-hotel-list");
  if (!listEl) return;

  Render.renderSkeleton(listEl, 3);

  try {
    const hotels = await Api.fetchHotels();

    fillHeroStats(hotels);

    if (!hotels.length) {
      listEl.innerHTML = '<p class="text-muted">No hotels available yet.</p>';
      return;
    }

    // API đã sắp xếp theo đánh giá giảm dần → lấy 6 khách sạn đầu
    await Render.renderHotelGrid(hotels.slice(0, 6), listEl);
  } catch (err) {
    console.error("Error loading hotels:", err);
    listEl.innerHTML = `<p class="form-error">${Utils.escapeHtml(err.message)}</p>`;
  }

  // Bấm "Book now" → đặt phòng (chưa đăng nhập sẽ bị đưa sang login)
  // Bấm chỗ khác trên thẻ → xem chi tiết
  listEl.addEventListener("click", (e) => {
    const card = e.target.closest(".hotel-card");
    const id = card && card.getAttribute("data-hotel-id");
    if (!id) return;

    if (e.target.closest(".btn-book-now")) Router.goToBooking(id);
    else Router.goToHotelDetail(id);
  });
}

// Số liệu trên ảnh bìa lấy từ dữ liệu thật thay vì ghi cứng
function fillHeroStats(hotels) {
  const countEl = document.getElementById("stat-hotels");
  const ratingEl = document.getElementById("stat-rating");
  const metaEl = document.getElementById("home-hero-meta");

  if (countEl) countEl.textContent = hotels.length;

  if (ratingEl && hotels.length) {
    const avg = hotels.reduce((sum, h) => sum + Number(h.rating), 0) / hotels.length;
    ratingEl.textContent = avg.toFixed(1) + "★";
  }

  // "Handpicked stays in Sa Pa, Hạ Long, ... and more."
  if (metaEl && hotels.length) {
    const places = [
      ...new Set(
        hotels
          .map((h) => (h.location || "").split(",")[0].trim())
          .filter(Boolean)
      ),
    ];
    const shown = places.slice(0, 4).join(", ");
    metaEl.textContent =
      "Handpicked stays in " + shown + (places.length > 4 ? " and more." : ".");
  }
}
