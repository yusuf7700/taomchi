// ===== Taomchi — sahifalar orasidagi navigatsiya =====
// Bu fayl index.html, recipes.html va boshqa asosiy sahifalarda ishlatiladi.

const ROUTES = {
  home: "index.html",
  recipes: "recipes.html",
  favorites: "favorites.html",
  profile: "profile.html",
  pantry: "pantry.html"
};

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    const page = item.getAttribute("data-page");
    if (ROUTES[page]) window.location.href = ROUTES[page];
  });
});

const backBtn = document.getElementById("backBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}
