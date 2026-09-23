// ===== Taomchi — asosiy logika =====

// --- Telegram WebApp ulanishi ---
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  // Telegram interfeysiga moslashtirish (headerBackgroundColor va h.k. keyinroq)
}

// --- Splash screen (1.8 soniyadan keyin yopiladi, faqat birinchi marta) ---
window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  if (!splash) return;

  if (sessionStorage.getItem("taomchi_splash_shown")) {
    maybeShowFeatureTour();
    return; // allaqachon inline script orqali yashirilgan
  }

  setTimeout(() => {
    splash.classList.add("hidden");
    sessionStorage.setItem("taomchi_splash_shown", "1");
    maybeShowFeatureTour();
  }, 1800);
});

// --- Xush kelibsiz ekrani (faqat umuman birinchi marta) ---
const ONBOARDING_SEEN_KEY = "taomchi_onboarding_seen";

function maybeShowOnboarding() {
  if (localStorage.getItem(ONBOARDING_SEEN_KEY)) return;
  const el = document.getElementById("onboarding");
  if (el) el.style.display = "flex";
}

function closeOnboarding() {
  localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
  const el = document.getElementById("onboarding");
  if (el) el.style.display = "none";
}

// --- Imkoniyatlar sayohati (3 ekran, "Xush kelibsiz"dan oldin, faqat bir marta) ---
const TOUR_SEEN_KEY = "taomchi_feature_tour_seen";
const TOUR_SLIDES = [
  { emoji: "🥕", titleKey: "tour1_title", descKey: "tour1_desc" },
  { emoji: "🗓", titleKey: "tour2_title", descKey: "tour2_desc" },
  { emoji: "🤖", titleKey: "tour3_title", descKey: "tour3_desc" }
];
let tourIndex = 0;

function renderTourSlide() {
  const dict = TRANSLATIONS[getCurrentLang()] || TRANSLATIONS.uz;
  const slide = TOUR_SLIDES[tourIndex];
  document.getElementById("tourEmoji").textContent = slide.emoji;
  document.getElementById("tourTitle").textContent = dict[slide.titleKey];
  document.getElementById("tourDesc").textContent = dict[slide.descKey];

  const dotsEl = document.getElementById("tourDots");
  dotsEl.innerHTML = TOUR_SLIDES.map((_, i) =>
    `<span class="tour-dot${i === tourIndex ? " active" : ""}"></span>`
  ).join("");

  const nextBtn = document.getElementById("tourNextBtn");
  const isLast = tourIndex === TOUR_SLIDES.length - 1;
  nextBtn.textContent = dict[isLast ? "tour_start" : "tour_next"];
}

function closeFeatureTour() {
  localStorage.setItem(TOUR_SEEN_KEY, "1");
  const el = document.getElementById("featureTour");
  if (el) el.style.display = "none";
  maybeShowOnboarding(); // Sayohatdan keyin — Premium sovg'a ekrani
}

function maybeShowFeatureTour() {
  if (localStorage.getItem(TOUR_SEEN_KEY)) {
    maybeShowOnboarding();
    return;
  }
  tourIndex = 0;
  renderTourSlide();
  const el = document.getElementById("featureTour");
  if (el) el.style.display = "flex";
}

document.getElementById("tourNextBtn")?.addEventListener("click", () => {
  if (tourIndex < TOUR_SLIDES.length - 1) {
    tourIndex++;
    renderTourSlide();
  } else {
    closeFeatureTour();
  }
});

document.getElementById("tourSkipBtn")?.addEventListener("click", closeFeatureTour);

document.getElementById("startTrialBtn")?.addEventListener("click", () => {
  closeOnboarding();
  window.location.href = "profile.html";
});
document.getElementById("skipTrialBtn")?.addEventListener("click", closeOnboarding);

// --- Bosh sahifadagi qidiruv (Enter bosilsa, Retseptlar sahifasiga o'tkazadi) ---
const homeSearchInput = document.getElementById("homeSearchInput");
const searchSuggestionsEl = document.getElementById("searchSuggestions");
const RECENT_SEARCHES_KEY = "taomchi_recent_searches";
const QUICK_CATEGORIES = ["main", "soup", "salad"];
let searchRecipesCache = [];

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
  } catch {
    return [];
  }
}

function addRecentSearch(term) {
  const clean = term.trim();
  if (!clean) return;
  const list = getRecentSearches().filter(t => t.toLowerCase() !== clean.toLowerCase());
  list.unshift(clean);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 4)));
  } catch {
    // localStorage yopiq bo'lishi mumkin, e'tiborsiz qoldiramiz
  }
}

function categoryLabelHome(cat) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return dict["cat_" + cat] || cat;
}

function goToRecipes(query) {
  addRecentSearch(query);
  window.location.href = `recipes.html?q=${encodeURIComponent(query)}`;
}

function renderSearchSuggestions() {
  if (!searchSuggestionsEl) return;
  const query = homeSearchInput.value.trim();

  if (query) {
    const q = cyrillicToLatin(query.toLowerCase());
    const matches = searchRecipesCache
      .filter(r => cyrillicToLatin((r.title || "").toLowerCase()).includes(q))
      .slice(0, 5);

    if (matches.length === 0) {
      searchSuggestionsEl.classList.add("screen-hidden");
      searchSuggestionsEl.innerHTML = "";
      return;
    }

    searchSuggestionsEl.innerHTML = matches.map(r => `
      <div class="search-suggestion-item" data-id="${escapeHtml(r.id)}">
        <span class="s-icon">🍽️</span>
        <span>${escapeHtml(displayTitle(r))}</span>
      </div>
    `).join("");

    searchSuggestionsEl.querySelectorAll(".search-suggestion-item").forEach(item => {
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        window.location.href = `recipe-detail.html?id=${item.getAttribute("data-id")}`;
      });
    });

    searchSuggestionsEl.classList.remove("screen-hidden");
    return;
  }

  // Qidiruv bo'sh — so'nggi qidiruvlar va mashhur kategoriyalar ko'rsatiladi
  const recent = getRecentSearches();
  let html = "";

  if (recent.length > 0) {
    html += `<p class="search-suggestions-label" data-i18n="recent_searches">So'nggi qidiruvlar</p>`;
    html += recent.map(term => `
      <div class="search-suggestion-item" data-term="${escapeHtml(term)}">
        <span class="s-icon">🕘</span>
        <span>${escapeHtml(term)}</span>
      </div>
    `).join("");
  }

  html += `<p class="search-suggestions-label" data-i18n="popular_categories">Mashhur kategoriyalar</p>`;
  html += QUICK_CATEGORIES.map(cat => `
    <div class="search-suggestion-item" data-cat="${cat}">
      <span class="s-icon">🔥</span>
      <span>${escapeHtml(categoryLabelHome(cat))}</span>
    </div>
  `).join("");

  searchSuggestionsEl.innerHTML = html;

  searchSuggestionsEl.querySelectorAll(".search-suggestion-item[data-term]").forEach(item => {
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      goToRecipes(item.getAttribute("data-term"));
    });
  });
  searchSuggestionsEl.querySelectorAll(".search-suggestion-item[data-cat]").forEach(item => {
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      window.location.href = `recipes.html?cat=${item.getAttribute("data-cat")}`;
    });
  });

  searchSuggestionsEl.classList.remove("screen-hidden");
}

if (homeSearchInput) {
  loadRecipesWithCache((recipes) => { searchRecipesCache = recipes; });

  homeSearchInput.addEventListener("focus", renderSearchSuggestions);
  homeSearchInput.addEventListener("input", renderSearchSuggestions);
  homeSearchInput.addEventListener("blur", () => {
    setTimeout(() => searchSuggestionsEl?.classList.add("screen-hidden"), 120);
  });

  homeSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && homeSearchInput.value.trim()) {
      goToRecipes(homeSearchInput.value.trim());
    }
  });
}

// --- Tasodifiy taom (bosh sahifada kichik karta bilan, faqat asosiy+sho'rva) ---
const RANDOM_POOL_CATEGORIES = ["main", "soup"];
let currentRandomRecipe = null;

function pickRandomRecipe(list) {
  const pool = list.filter(r => RANDOM_POOL_CATEGORIES.includes(r.category));
  const source = pool.length > 0 ? pool : list;
  return source[Math.floor(Math.random() * source.length)];
}

function showRandomModal(r) {
  currentRandomRecipe = r;
  const dict = TRANSLATIONS[getCurrentLang()] || TRANSLATIONS.uz;

  document.getElementById("randomModalThumb").innerHTML = r.imageUrl
    ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}">`
    : "🍽️";
  document.getElementById("randomModalTitle").textContent = r.title;
  document.getElementById("randomModalMeta").innerHTML =
    `⏱ ${formatCookTime(r)}   ${difficultyBadge(r)}`;

  const modal = document.getElementById("randomModal");
  const box = document.getElementById("randomModalBox");
  modal.style.display = "flex";
  // Animatsiyani qayta ishga tushirish (qayta bosilganda ham)
  box.style.animation = "none";
  void box.offsetWidth;
  box.style.animation = "";
}

function runRandomPick() {
  const cached = getCachedRecipes();
  if (cached && cached.data.length > 0) {
    showRandomModal(pickRandomRecipe(cached.data));
    return;
  }
  db.collection("recipes").get().then(snapshot => {
    if (snapshot.empty) return;
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    showRandomModal(pickRandomRecipe(list));
  });
}

document.getElementById("randomBtn")?.addEventListener("click", runRandomPick);
document.getElementById("randomModalAgain")?.addEventListener("click", runRandomPick);
document.getElementById("randomModalClose")?.addEventListener("click", () => {
  document.getElementById("randomModal").style.display = "none";
});
document.getElementById("randomModalView")?.addEventListener("click", () => {
  if (currentRandomRecipe) {
    window.location.href = `recipe-detail.html?id=${currentRandomRecipe.id}`;
  }
});

// --- 3 ta asosiy tugma (Uyda bor / AI / Haftalik menyu) ---
const actionCards = document.querySelectorAll(".action-card");
actionCards.forEach(card => {
  card.addEventListener("click", () => {
    const action = card.getAttribute("data-action");
    if (action === "pantry") {
      window.location.href = "pantry.html";
      return;
    }
    if (action === "weekly") {
      window.location.href = "weekly-menu.html";
      return;
    }
    if (action === "ai") {
      window.location.href = "ai.html";
      return;
    }
    console.log("Amal tanlandi:", action);
  });
});

// --- Kategoriya tugmalari ---
const categoryCards = document.querySelectorAll(".category-card");
categoryCards.forEach(card => {
  card.addEventListener("click", () => {
    if (card.hasAttribute("data-diet")) {
      window.location.href = "recipes.html?diet=1";
      return;
    }
    const cat = card.getAttribute("data-cat");
    window.location.href = `recipes.html?cat=${cat}`;
  });
});

// --- Bugungi tavsiya kartasi ---
// Kuniga bittadan, faqat "Asosiy taomlar" va "Sho'rvalar" — boshqa
// kategoriyalar (nonushta, shirinlik, ichimlik va h.k.) chiqmaydi.
// Barcha foydalanuvchilarga bir xil, lekin har kuni almashadi.
const DAILY_ALLOWED_CATEGORIES = ["main", "soup"];

function pickDailyRecipe(list) {
  const pool = list.filter(r => DAILY_ALLOWED_CATEGORIES.includes(r.category));
  const source = pool.length > 0 ? pool : list;
  if (source.length === 0) return null;

  const dayIndex = Math.floor(Date.now() / 86400000);
  return source[dayIndex % source.length];
}

function renderDailyRecipe(r) {
  const dailyEl = document.getElementById("dailyRecipe");
  if (!dailyEl || !r) return;

  const thumbEl = dailyEl.querySelector(".recipe-thumb");
  thumbEl.classList.remove("skeleton-block");
  thumbEl.innerHTML = (r.imageUrl
    ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}">`
    : "🍽️") + premiumRibbon(r);

  const titleEl = dailyEl.querySelector(".recipe-title");
  titleEl.classList.remove("skeleton-line", "skeleton-line--title");
  titleEl.textContent = displayTitle(r);

  const metaEl = dailyEl.querySelector(".recipe-meta");
  metaEl.classList.remove("skeleton-line", "skeleton-line--meta");
  metaEl.innerHTML = `<span>⏱ ${formatCookTime(r)}</span>${difficultyBadge(r)}`;

  dailyEl.onclick = () => { window.location.href = `recipe-detail.html?id=${r.id}`; };
}

if (document.getElementById("dailyRecipe")) {
  loadRecipesWithCache((recipes) => {
    renderDailyRecipe(pickDailyRecipe(recipes));
  });
}

// --- Ramazon banneri (faqat Ramazon oyida ko'rinadi) ---
// Sanalar taxminiy (oy ko'rinishiga bog'liq) — har yili yangilanishi kerak.
const RAMADAN_PERIODS = [
  { start: "2027-02-07", end: "2027-03-09" } // Ramazon 1448 (2027)
];

function isRamadanNow() {
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, qurilma vaqti
  return RAMADAN_PERIODS.some(p => todayKey >= p.start && todayKey <= p.end);
}

function maybeShowRamadanBanner() {
  const banner = document.getElementById("ramadanBanner");
  if (banner) banner.classList.toggle("screen-hidden", !isRamadanNow());
}

maybeShowRamadanBanner();
