// ===== Taomchi — sahifalar orasidagi navigatsiya =====
// Bu fayl index.html, recipes.html va boshqa asosiy sahifalarda ishlatiladi.

const ROUTES = {
  home: "index.html",
  recipes: "recipes.html",
  favorites: "favorites.html",   // hali qurilmagan
  profile: "profile.html"        // hali qurilmagan
};

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    const page = item.getAttribute("data-page");
    if (page === "favorites" || page === "profile") {
      console.log("Bu sahifa hali tayyor emas:", page);
      return; // keyingi bosqichda quriladi
    }
    if (ROUTES[page]) window.location.href = ROUTES[page];
  });
});

const backBtn = document.getElementById("backBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}
