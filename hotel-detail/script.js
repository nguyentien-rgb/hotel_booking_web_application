// hotel-detail/script.js — chi tiết 1 khách sạn (?id=)
document.addEventListener("DOMContentLoaded", function () {
  // Shared layout: header/footer, dark mode...
  if (window.Render && Render.initSharedLayout) {
    // ngày xưa bạn để "../shared", "" – có thể giữ "" nếu CSS đang phụ thuộc
    Render.initSharedLayout("../shared", "hotel-detail");
  }
  initHotelDetail();
});

async function initHotelDetail() {
  const section = document.getElementById("hotel-detail-section");
  if (!section) {
    console.warn("Không tìm thấy #hotel-detail-section");
    return;
  }

  // Lấy id từ query string: ?id=...
  const idStr = (window.Utils && Utils.getQueryParam)
    ? Utils.getQueryParam("id")
    : new URLSearchParams(window.location.search).get("id");

  const id = idStr ? Number(idStr) : NaN;

  if (!id) {
    section.innerHTML =
      '<p class="text-muted">Invalid hotel id. <a href="../search/index.html">Back to search</a>.</p>';
    return;
  }

  section.innerHTML = '<p class="text-muted">Loading hotel...</p>';

  try {
    // ===== LẤY DATA TỪ API =====
    const hotel = await Api.fetchHotelById(id);

    if (!hotel) {
      section.innerHTML =
        '<p class="text-muted">Hotel not found. <a href="../search/index.html">Back to search</a>.</p>';
      return;
    }

    const mainImage =
      hotel.images && hotel.images.length ? hotel.images[0] : "";

    // ===== GIỮ LAYOUT CŨ CỦA BẠN (gallery + thumbs + map + 2 nút) =====
    const esc = Utils.escapeHtml;
    const images = hotel.images && hotel.images.length ? hotel.images : [""];

    section.innerHTML = `
      <div class="hotel-detail-gallery">
        <div class="hotel-gallery-main">
          <img id="hotel-main-image" src="${esc(images[0])}" alt="${esc(hotel.name)}" />
        </div>
        ${
          images.length > 1
            ? `<div class="hotel-gallery-thumbs">
                ${images
                  .map(
                    (img, i) =>
                      `<img src="${esc(img)}" alt="${esc(hotel.name)} photo ${i + 1}" data-thumb-image="${esc(img)}" class="${i === 0 ? "active" : ""}" />`
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>

      <aside class="hotel-detail-info">
        <span class="hotel-detail-location">📍 ${esc(hotel.location)}</span>
        <h1>${esc(hotel.name)}</h1>
        <div class="hotel-detail-rating">
          <span class="rating-pill">★ ${Number(hotel.rating || 0).toFixed(1)}</span>
          <span class="text-muted">Guest rating</span>
        </div>

        <p class="hotel-detail-description">${esc(hotel.description || "No description yet.")}</p>

        <div class="hotel-booking-box">
          <div class="hotel-detail-price">
            ${Utils.formatPrice(Number(hotel.price))}
            <span>/ guest / night</span>
          </div>
          <div class="hotel-detail-cta">
            <button class="btn btn-gold btn-full" id="btn-book-now" type="button">Book now</button>
            <button class="btn btn-outline btn-full" id="btn-back-search" type="button">Back to search</button>
          </div>
        </div>
      </aside>
    `;

    // ===== THUMBNAIL -> đổi ảnh main =====
    const thumbs = section.querySelectorAll("[data-thumb-image]");
    const mainImgEl = document.getElementById("hotel-main-image");

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        const src = thumb.getAttribute("data-thumb-image");
        if (src && mainImgEl) {
          mainImgEl.src = src;
          thumbs.forEach((t) => t.classList.toggle("active", t === thumb));
        }
      });
    });

    // ===== NÚT BOOK NOW / BACK TO SEARCH =====
    const btnBook = document.getElementById("btn-book-now");
    const btnBack = document.getElementById("btn-back-search");

    if (btnBook) {
      btnBook.addEventListener("click", function () {

        if (window.Router && typeof Router.goToBooking === "function") {
          Router.goToBooking(id);
        } else {
          window.location.href =
            "../booking/index.html?id=" + encodeURIComponent(id);
        }
      });
    }

    if (btnBack) {
      btnBack.addEventListener("click", function () {
        if (window.Router && typeof Router.goToSearch === "function") {
          Router.goToSearch("");
        } else {
          window.location.href = "../search/index.html";
        }
      });
    }
  } catch (err) {
    console.error("Lỗi khi load chi tiết hotel:", err);
    section.innerHTML =
      '<p class="text-muted">Failed to load hotel detail from server.</p>';
  }
}
