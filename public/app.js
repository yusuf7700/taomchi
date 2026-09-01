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
    maybeShowOnboarding();
    return; // allaqachon inline script orqali yashirilgan
  }

  setTimeout(() => {
    splash.classList.add("hidden");
    sessionStorage.setItem("taomchi_splash_shown", "1");
    maybeShowOnboarding();
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

document.getElementById("startTrialBtn")?.addEventListener("click", () => {
  closeOnboarding();
  window.location.href = "profile.html";
});
document.getElementById("skipTrialBtn")?.addEventListener("click", closeOnboarding);

// --- Bosh sahifadagi qidiruv (Enter bosilsa, Retseptlar sahifasiga o'tkazadi) ---
const homeSearchInput = document.getElementById("homeSearchInput");
if (homeSearchInput) {
  homeSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && homeSearchInput.value.trim()) {
      window.location.href = `recipes.html?q=${encodeURIComponent(homeSearchInput.value.trim())}`;
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
    ? `<img src="${r.imageUrl}" alt="${r.title}">`
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

  dailyEl.querySelector(".recipe-thumb").innerHTML = r.imageUrl
    ? `<img src="${r.imageUrl}" alt="${r.title}">`
    : "🍽️";
  dailyEl.querySelector(".recipe-title").textContent = displayTitle(r);
  dailyEl.querySelector(".recipe-meta").innerHTML =
    `<span>⏱ ${formatCookTime(r)}</span>${difficultyBadge(r)}`;
  dailyEl.onclick = () => { window.location.href = `recipe-detail.html?id=${r.id}`; };
}

if (document.getElementById("dailyRecipe")) {
  loadRecipesWithCache((recipes) => {
    renderDailyRecipe(pickDailyRecipe(recipes));
  });
}

const dailyRecipe = document.getElementById("dailyRecipe");
if (dailyRecipe) {
  dailyRecipe.addEventListener("click", () => {
    console.log("Retsept ochilmoqda...");
    // TODO: retsept detali sahifasiga o'tish
  });
    }
                        
