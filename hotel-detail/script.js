/*document.addEventListener("DOMContentLoaded", function () {
  Render.initSharedLayout("../shared", "");
  initHotelDetail();
});

function initHotelDetail() {
  const idStr = Utils.getQueryParam("id");
  const id = idStr ? Number(idStr) : NaN;
  const section = document.getElementById("hotel-detail-section");

  const hotels = window.HOTELS || [];
  const hotel = hotels.find((h) => h.id === id);

  if (!hotel) {
    section.innerHTML =
      '<p class="text-muted">Hotel not found. <a href="../search/index.html">Back to search</a>.</p>';
    return;
  }

  const mainImage = hotel.images && hotel.images.length ? hotel.images[0] : "";

  section.innerHTML = `
    <div class="hotel-detail-gallery">
      <div class="hotel-gallery-main">
        <img id="hotel-main-image" src="${mainImage}" alt="${hotel.name}" />
      </div>
      <div class="hotel-gallery-thumbs">
        ${hotel.images
          .map(
            (img) =>
              `<img src="${img}" alt="${hotel.name}" data-thumb-image="${img}" />`
          )
          .join("")}
      </div>
    </div>
    <div class="hotel-detail-info">
      <h1>${hotel.name}</h1>
      <div class="hotel-detail-meta">
        <span>${hotel.location}</span> • <span>${hotel.rating.toFixed(1)}★ rating</span>
      </div>
      <p class="hotel-detail-description">${hotel.description}</p>
      <div class="hotel-detail-price">
        ${Utils.formatPrice(hotel.price)} <span class="text-muted">/ night, per guest</span>
      </div>
      <div class="hotel-detail-cta">
        <button class="btn btn-gold" id="btn-book-now" type="button">Book now</button>
        <button class="btn btn-outline" id="btn-back-search" type="button">Back to search</button>
      </div>
      <div class="hotel-map-placeholder">
        Map preview (mock): Located in ${hotel.location}. Replace with interactive map later.
      </div>
    </div>
  `;

  const thumbs = section.querySelectorAll("[data-thumb-image]");
  const mainImgEl = document.getElementById("hotel-main-image");
  thumbs.forEach(function (thumb) {
    thumb.addEventListener("click", function () {
      const src = thumb.getAttribute("data-thumb-image");
      if (src && mainImgEl) {
        mainImgEl.src = src;
      }
    });
  });

  const btnBook = document.getElementById("btn-book-now");
  const btnBack = document.getElementById("btn-back-search");

  if (btnBook) {
    btnBook.addEventListener("click", function () {
      Router.goToBooking(hotel.id);
    });
  }

  if (btnBack) {
    btnBack.addEventListener("click", function () {
      Router.goToSearch("");
    });
  }
}
*/
// /hotel-detail/script.js
// /hotel-detail/script.js
// thêm ở đầu file (sau getQueryParam cũng được)
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("current_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
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
    // ===== LẤY DATA TỪ BACKEND (MySQL) =====
    const hotel = await Api.fetchHotelById(id);

    if (!hotel) {
      section.innerHTML =
        '<p class="text-muted">Hotel not found. <a href="../search/index.html">Back to search</a>.</p>';
      return;
    }

    const mainImage =
      hotel.images && hotel.images.length ? hotel.images[0] : "";

    // ===== GIỮ LAYOUT CŨ CỦA BẠN (gallery + thumbs + map + 2 nút) =====
    section.innerHTML = `
      <div class="hotel-detail-gallery">
        <div class="hotel-gallery-main">
          <img id="hotel-main-image" src="${mainImage}" alt="${hotel.name}" />
        </div>
        <div class="hotel-gallery-thumbs">
          ${
            hotel.images && hotel.images.length
              ? hotel.images
                  .map(
                    (img) =>
                      `<img src="${img}" alt="${hotel.name}" data-thumb-image="${img}" />`
                  )
                  .join("")
              : ""
          }
        </div>
      </div>

      <div class="hotel-detail-info">
        <h1>${hotel.name}</h1>
        <div class="hotel-detail-meta">
          <span>${hotel.location}</span> •
          <span>${Number(hotel.rating || 0).toFixed(1)}★ rating</span>
        </div>
        <p class="hotel-detail-description">
          ${hotel.description || ""}
        </p>
        <div class="hotel-detail-price">
          ${
            window.Utils && Utils.formatPrice
              ? Utils.formatPrice(hotel.price)
              : hotel.price.toLocaleString() + " VND"
          }
          <span class="text-muted">/ night, per guest</span>
        </div>

        <div class="hotel-detail-cta">
          <button class="btn btn-gold" id="btn-book-now" type="button">
            Book now
          </button>
          <button class="btn btn-outline" id="btn-back-search" type="button">
            Back to search
          </button>
        </div>

        <div class="hotel-map-placeholder">
          Map preview (mock): Located in ${hotel.location}.
          Replace with interactive map later.
        </div>
      </div>
    `;

    // ===== THUMBNAIL -> đổi ảnh main =====
    const thumbs = section.querySelectorAll("[data-thumb-image]");
    const mainImgEl = document.getElementById("hotel-main-image");

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        const src = thumb.getAttribute("data-thumb-image");
        if (src && mainImgEl) {
          mainImgEl.src = src;
        }
      });
    });

    // ===== NÚT BOOK NOW / BACK TO SEARCH =====
    const btnBook = document.getElementById("btn-book-now");
    const btnBack = document.getElementById("btn-back-search");

    if (btnBook) {
      btnBook.addEventListener("click", function () {
        // Lưu info để các trang sau dùng (nếu bạn muốn)
        localStorage.setItem("selected_hotel_id", String(id));
        localStorage.setItem("selected_hotel_name", hotel.name);
        localStorage.setItem("selected_hotel_price", String(hotel.price));

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
