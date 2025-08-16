document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    card.addEventListener("click", function () {
      // Đóng tất cả các card khác
      cards.forEach((otherCard) => {
        if (otherCard !== card) {
          otherCard.classList.remove("expanded");
        }
      });

      // Toggle card hiện tại
      card.classList.toggle("expanded");
    });
  });

  // Đóng card khi click ra ngoài
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".card")) {
      cards.forEach((card) => {
        card.classList.remove("expanded");
      });
    }
  });

  // Ngăn không đóng card khi click vào nội dung
  cards.forEach((card) => {
    const content = card.querySelector(".card-content");
    if (content) {
      content.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
  });
});
