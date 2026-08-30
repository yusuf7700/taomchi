// ===== Taomchi — Haftalik ovqat rejasi (Tushlik + Kechki ovqat) =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL_KEYS = {
  mon: "day_mon", tue: "day_tue", wed: "day_wed", thu: "day_thu",
  fri: "day_fri", sat: "day_sat", sun: "day_sun"
};
const MEALS = ["lunch", "dinner"];
const MEAL_LABEL_KEYS = { lunch: "meal_lunch", dinner: "meal_dinner" };
const MEAL_ICONS = { lunch: "🍽️", dinner: "🌙" };

// Haftalik rejaga faqat asosiy taomlar va sho'rvalar tavsiya qilinadi —
// shirinlik, ichimlik, salat kabi kategoriyalar kunlik ovqat rejasiga mos
// kelmaydi.
const WEEKLY_CATEGORIES = ["main", "soup"];

const WEEKLY_CACHE_KEY = "taomchi_weekly_menu_cache";

const dayListView = document.getElementById("dayListView");
const pickerView = document.getElementById("pickerView");
const weeklyDayList = document.getElementById("weeklyDayList");
const pickerList = document.getElementById("pickerList");
const pickerBackBtn = document.getElementById("pickerBackBtn");
const pickerTitleText = document.getElementById("pickerTitleText");
const pickerSearch = document.getElementById("pickerSearch");
const progressFill = document.getElementById("weeklyProgressFill");
const progressText = document.getElementById("weeklyProgressText");

let currentMenu = {}; // { mon: { lunch: recipeId, dinner: recipeId }, ... }
let allRecipes = [];
let activeDay = null;
let activeMeal = null;
let lastSet = null; // { day, meal } — animatsiya uchun

function t(key, fallback) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return dict[key] || fallback || key;
}

function findRecipe(id) {
  return allRecipes.find(r => r.id === id);
}

function getPickableRecipes() {
  return allRecipes.filter(r => WEEKLY_CATEGORIES.includes(r.category));
}

// O'zbekiston vaqti bo'yicha bugungi kun kalitini hisoblaydi (UTC+5)
function getTodayKey() {
  const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const shifted = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return DAY_KEYS[shifted.getUTCDay()];
}

// ===== Mahalliy kesh (darrov ko'rsatish uchun — server sekin javob bersa ham) =====
function getCachedMenu() {
  try {
    const raw = localStorage.getItem(WEEKLY_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedMenu(days) {
  try {
    localStorage.setItem(WEEKLY_CACHE_KEY, JSON.stringify(days));
  } catch {
    // localStorage to'lib qolgan bo'lishi mumkin, e'tiborsiz qoldiramiz
  }
}

function updateProgress() {
  let filled = 0;
  DAYS.forEach(day => {
    const d = currentMenu[day] || {};
    if (d.lunch) filled++;
    if (d.dinner) filled++;
  });
  const total = DAYS.length * MEALS.length;
  progressFill.style.width = `${Math.round((filled / total) * 100)}%`;
  progressText.textContent = `${filled}/${total}`;
}

// ===== Kunlar ro'yxatini chizish =====
function renderMealSlot(day, meal) {
  const dayData = currentMenu[day] || {};
  const recipeId = dayData[meal];
  const recipe = recipeId ? findRecipe(recipeId) : null;
  const justSet = lastSet && lastSet.day === day && lastSet.meal === meal;
  const mealLabel = `${MEAL_ICONS[meal]} ${t(MEAL_LABEL_KEYS[meal])}`;

  if (recipe) {
    return `
      <div class="weekly-meal-slot">
        <p class="weekly-meal-label">${mealLabel}</p>
        <div class="weekly-day-card ${justSet ? "weekly-day-card--pop" : ""}" data-day-select="${day}" data-meal-select="${meal}">
          <div class="recipe-thumb recipe-thumb--sm">
            ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.title}">` : "🍽️"}
          </div>
          <p class="weekly-day-recipe-title">${displayTitle(recipe)}</p>
          <button class="weekly-day-clear" data-day-clear="${day}" data-meal-clear="${meal}">✕</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="weekly-meal-slot">
      <p class="weekly-meal-label">${mealLabel}</p>
      <button class="weekly-day-empty" data-day-select="${day}" data-meal-select="${meal}">+ ${t("weekly_choose", "Retsept tanlash")}</button>
    </div>
  `;
}

function renderDays() {
  const todayKey = getTodayKey();

  weeklyDayList.innerHTML = DAYS.map(day => {
    const isToday = day === todayKey;
    return `
      <div class="weekly-day-row" data-day="${day}">
        <p class="weekly-day-label">${t(DAY_LABEL_KEYS[day])}${isToday ? `<span class="weekly-today-badge">${t("weekly_today", "Bugun")}</span>` : ""}</p>
        <div class="weekly-meal-grid ${isToday ? "weekly-meal-grid--today" : ""}">
          ${renderMealSlot(day, "lunch")}
          ${renderMealSlot(day, "dinner")}
        </div>
      </div>
    `;
  }).join("");

  lastSet = null; // animatsiya faqat bir marta ko'rsatiladi
  updateProgress();
}

// Event delegation: kunlar ro'yxati har safar qayta chizilsa ham, bitta
// doimiy listener orqali bosishlarni ushlaymiz. "click" ishlatiladi
// (pointerdown emas) — brauzer buni faqat haqiqiy bosishda ishga tushiradi,
// ro'yxatni surish harakatida esa avtomatik bekor qiladi.
weeklyDayList.addEventListener("click", (e) => {
  const clearBtn = e.target.closest("[data-day-clear]");
  if (clearBtn) {
    setMeal(clearBtn.getAttribute("data-day-clear"), clearBtn.getAttribute("data-meal-clear"), null);
    return;
  }
  const selectEl = e.target.closest("[data-day-select]");
  if (selectEl) {
    openPicker(selectEl.getAttribute("data-day-select"), selectEl.getAttribute("data-meal-select"));
  }
});

// ===== Retsept tanlash ko'rinishi (sahifa ichida, oyna emas) =====
function openPicker(day, meal) {
  activeDay = day;
  activeMeal = meal;
  pickerTitleText.textContent = `${t(MEAL_LABEL_KEYS[meal])} ${getCurrentLang() === "uzk" ? "танлаш" : "tanlash"}`;
  pickerSearch.value = "";
  renderPickerList(getPickableRecipes());

  dayListView.classList.add("screen-hidden");
  pickerView.classList.remove("screen-hidden");
  pickerView.classList.remove("view-enter");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => pickerView.classList.add("view-enter"));
  });
  window.scrollTo(0, 0);
}

function closePicker() {
  pickerView.classList.add("screen-hidden");
  pickerView.classList.remove("view-enter");
  dayListView.classList.remove("screen-hidden");
  activeDay = null;
  activeMeal = null;
}

function renderPickerList(recipes) {
  if (recipes.length === 0) {
    pickerList.innerHTML = `<p class="empty-text">${t("weekly_no_results", "Hech narsa topilmadi")}</p>`;
    return;
  }

  pickerList.innerHTML = recipes.map(r => `
    <div class="picker-item" data-picker-id="${r.id}">
      <div class="recipe-thumb recipe-thumb--sm">
        ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}">` : "🍽️"}
      </div>
      <p class="picker-item-title">${displayTitle(r)}</p>
    </div>
  `).join("");
}

function applyPickerFilter() {
  const q = pickerSearch.value.trim().toLowerCase();
  const base = getPickableRecipes();
  if (!q) return base;
  return base.filter(r => (r.title || "").toLowerCase().includes(q));
}

pickerSearch.addEventListener("input", () => {
  renderPickerList(applyPickerFilter());
});

pickerList.addEventListener("click", (e) => {
  const item = e.target.closest("[data-picker-id]");
  if (!item || !activeDay || !activeMeal) return;
  setMeal(activeDay, activeMeal, item.getAttribute("data-picker-id"));
  closePicker();
});

pickerBackBtn.addEventListener("click", closePicker);

// ===== Saqlash (server bilan sinxron) =====
async function setMeal(day, meal, recipeId) {
  currentMenu = {
    ...currentMenu,
    [day]: { ...(currentMenu[day] || {}), [meal]: recipeId }
  };
  lastSet = recipeId ? { day, meal } : null;
  renderDays();
  setCachedMenu(currentMenu);

  if (!tg?.initData) return; // Telegram tashqarisida ochilgan bo'lishi mumkin
  try {
    await fetch("/api/weekly-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, day, meal, recipeId })
    });
  } catch {
    // Internet yo'q bo'lishi mumkin — UI holati saqlanadi, keyingi ochilishda qayta yuklanadi
  }
}

// ===== Boshlang'ich yuklash =====
// Avval keshdan (bor bo'lsa) darrov ko'rsatamiz — server javobini kutib
// o'tirmasdan. Bu sahifa ochilishini sezilarli tezlashtiradi.
const cachedMenu = getCachedMenu();
if (cachedMenu) currentMenu = cachedMenu;
renderDays();

loadRecipesWithCache((recipes) => {
  allRecipes = recipes;
  renderDays();
  // Agar retsept tanlash ko'rinishi ochiq turgan bo'lsa (retseptlar hali
  // yuklanmagan payt ochilgan bo'lishi mumkin), ro'yxatni ham yangilaymiz
  if (activeDay) renderPickerList(applyPickerFilter());
});

if (tg?.initData) {
  fetch(`/api/weekly-menu?initData=${encodeURIComponent(tg.initData)}`)
    .then(res => res.ok ? res.json() : { days: {} })
    .then(data => {
      currentMenu = data.days || {};
      setCachedMenu(currentMenu);
      renderDays();
    })
    .catch(() => {
      // Internet yo'q — keshdan ko'rsatilgan holatda qoladi
    });
}
