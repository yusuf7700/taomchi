// ===== Taomchi — sahifalar orasidagi navigatsiya =====
// Bu fayl index.html, recipes.html va boshqa asosiy sahifalarda ishlatiladi.

// Telegram header/fon ranglari tg-theme.js da (barcha sahifalarda <head> ichida)

const ROUTES = {
  home: "index.html",
  recipes: "recipes.html",
  favorites: "favorites.html",
  profile: "profile.html",
  pantry: "pantry.html",
  weekly: "weekly-menu.html"
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

// ===== Pastga surib yangilash (pull-to-refresh) =====
(function () {
  if (/ai\.html$/.test(location.pathname)) return; // AI chatda o'z skrolli bor

  try { window.Telegram?.WebApp?.disableVerticalSwipes?.(); } catch (e) {}

  const THRESHOLD = 70;   // shuncha px tortilganda yangilanadi
  const MAX_PULL = 110;

  const ind = document.createElement("div");
  ind.className = "ptr";
  ind.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>';
  document.body.appendChild(ind);

  let startY = 0, pull = 0, active = false, loading = false;

  function atTop() {
    return (document.scrollingElement || document.documentElement).scrollTop <= 0;
  }
  // Ichki skrollanadigan elementdan boshlangan tortishni e'tiborsiz qoldiramiz
  function insideScrolled(el) {
    while (el && el !== document.body) {
      if (el.scrollTop > 0) return true;
      el = el.parentElement;
    }
    return false;
  }
  function draw(y) {
    ind.style.transform = "translate(-50%, " + (y - 56) + "px) rotate(" + (y * 3) + "deg)";
    ind.style.opacity = Math.min(1, y / THRESHOLD);
    ind.classList.toggle("ptr--ready", y >= THRESHOLD);
  }

  document.addEventListener("touchstart", function (e) {
    if (loading || e.touches.length !== 1) return;
    const t = e.target;
    if (!atTop() || insideScrolled(t) || t.closest("input, textarea, .modal, [class*='modal']")) return;
    startY = e.touches[0].clientY;
    active = true;
    pull = 0;
    ind.style.transition = "none";
  }, { passive: true });

  document.addEventListener("touchmove", function (e) {
    if (!active || loading) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0 || !atTop()) { pull = 0; draw(0); return; }
    pull = Math.min(MAX_PULL, dy * 0.5); // qarshilik effekti
    draw(pull);
  }, { passive: true });

  function end() {
    if (!active) return;
    active = false;
    ind.style.transition = "transform 0.25s ease, opacity 0.25s ease";
    if (pull >= THRESHOLD && !loading) {
      loading = true;
      ind.classList.add("ptr--loading");
      ind.style.transform = "translate(-50%, 16px)";
      ind.style.opacity = 1;
      try { localStorage.removeItem("taomchi_recipes_cache"); } catch (e) {}
      setTimeout(function () { location.reload(); }, 250);
    } else {
      draw(0);
    }
    pull = 0;
  }
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });
})();
