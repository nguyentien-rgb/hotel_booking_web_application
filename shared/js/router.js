(function () {
  function goToHome() {
    window.location.href = "../home/index.html";
  }

  function goToSearch(query) {
    let url = "../search/index.html";
    if (query && query.trim()) {
      url += "?q=" + encodeURIComponent(query.trim());
    }
    window.location.href = url;
  }

  function goToHotelDetail(hotelId) {
    window.location.href = "../hotel-detail/index.html?id=" + encodeURIComponent(hotelId);
  }

  function goToBooking(hotelId) {
    window.location.href = "../booking/index.html?id=" + encodeURIComponent(hotelId);
  }

  function goToPayment() {
    window.location.href = "../payment/index.html";
  }

  function goToProfile() {
    window.location.href = "../profile/index.html";
  }

  function goToLogin() {
    window.location.href = "../login/index.html";
  }

  function goToRegister() {
    window.location.href = "../register/index.html";
  }

  window.Router = {
    goToHome,
    goToSearch,
    goToHotelDetail,
    goToBooking,
    goToPayment,
    goToProfile,
    goToLogin,
    goToRegister,
  };
})();
