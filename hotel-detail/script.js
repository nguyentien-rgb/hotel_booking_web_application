document.addEventListener("DOMContentLoaded", function () {
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
