// ===== Taomchi — Haftalik ovqat rejasi ("Bitta kunga e'tibor" ko'rinishi) =====
// Barcha 7 kun bir vaqtda ko'rsatilmaydi (uzun surish talab qilardi).
// Buning o'rniga: tepada kichik kun tugmalari, pastda faqat TANLANGAN
// kunning 2ta ovqati (Tushlik, Kechki ovqat) ko'rinadi.

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL_KEYS = {
  mon: "day_mon", tue: "day_tue", wed: "day_wed", thu: "day_thu",
  fri: "day_fri", sat: "day_sat", sun: "day_sun"
};
const DAY_SHORT_KEYS = {
  mon: "day_short_mon", tue: "day_short_tue", wed: "day_short_wed", thu: "day_short_thu",
  fri: "day_short_fri", sat: "day_short_sat", sun: "day_short_sun"
};
const MEALS = ["lunch", "dinner"];
const MEAL_LABEL_KEYS = { lunch: "meal_lunch", dinner: "meal_dinner" };
const MEAL_ICONS = { lunch: "🍽️", dinner: "🌙" };

// Haftalik rejaga faqat asosiy taomlar va sho'rvalar tavsiya qilinadi.
const WEEKLY_CATEGORIES = ["main", "soup"];

const WEEKLY_CACHE_KEY = "taomchi_weekly_menu_cache";

const dayListView = document.getElementById("dayListView");
const pickerView = document.getElementById("pickerView");
const dayTabsEl = document.getElementById("weeklyDayTabs");
const dayPanelEl = document.getElementById("weeklyDayPanel");
const pickerList = document.getElementById("pickerList");
const pickerBackBtn = document.getElementById("pickerBackBtn");
const pickerTitleText = document.getElementById("pickerTitleText");
const pickerSearch = document.getElementById("pickerSearch");
const progressFill = document.getElementById("weeklyProgressFill");
const progressText = document.getElementById("weeklyProgressText");

let currentMenu = {}; // { mon: { lunch: recipeId, dinner: recipeId }, ... }
let allRecipes = [];
let selectedDay = null; // hozir "fokusda" turgan kun (tab orqali tanlanadi)
let activeDay = null;   // retsept tanlash oynasi qaysi kun uchun ochilgan
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

// ===== Mahalliy kesh (darrov ko'rsatish uchun) =====
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

function isDayFilled(day) {
  const d = currentMenu[day] || {};
  return !!(d.lunch && d.dinner);
}

function isDayPartial(day) {
  const d = currentMenu[day] || {};
  return !!(d.lunch || d.dinner) && !isDayFilled(day);
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

// ===== Kun tugmalari (tepadagi tab'lar) =====
function renderDayTabs() {
  const todayKey = getTodayKey();

  dayTabsEl.innerHTML = DAYS.map(day => {
    const isActive = day === selectedDay;
    const isToday = day === todayKey;
    let dotClass = "";
    if (isDayFilled(day)) dotClass = "weekly-tab-dot--full";
    else if (isDayPartial(day)) dotClass = "weekly-tab-dot--partial";

    return `
      <button class="weekly-day-tab ${isActive ? "weekly-day-tab--active" : ""}" data-tab-day="${day}">
        ${isToday ? `<span class="weekly-tab-today-mark"></span>` : ""}
        <span>${t(DAY_SHORT_KEYS[day])}</span>
        ${dotClass ? `<span class="weekly-tab-dot ${dotClass}"></span>` : ""}
      </button>
    `;
  }).join("");

  // Tanlangan tab ko'rinadigan qismga suriladi (agar chekkada bo'lsa)
  const activeTabEl = dayTabsEl.querySelector(".weekly-day-tab--active");
  if (activeTabEl) activeTabEl.scrollIntoView({ inline: "center", block: "nearest" });
}

dayTabsEl.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-tab-day]");
  if (!tab) return;
  selectDay(tab.getAttribute("data-tab-day"));
});

function selectDay(day) {
  if (day === selectedDay) return;
  selectedDay = day;
  renderDayTabs();
  renderDayPanel({ animate: true });
}

// ===== Tanlangan kunning paneli (Tushlik + Kechki ovqat) =====
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
            ${recipe.imageUrl ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}">` : "🍽️"}
          </div>
          <p class="weekly-day-recipe-title">${escapeHtml(displayTitle(recipe))}</p>
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

function renderDayPanel(opts = {}) {
  const day = selectedDay;
  const todayKey = getTodayKey();
  const isToday = day === todayKey;

  dayPanelEl.innerHTML = `
    <p class="weekly-panel-title">${t(DAY_LABEL_KEYS[day])}${isToday ? `<span class="weekly-today-badge">${t("weekly_today", "Bugun")}</span>` : ""}</p>
    ${renderMealSlot(day, "lunch")}
    ${renderMealSlot(day, "dinner")}
  `;

  if (opts.animate) {
    dayPanelEl.classList.remove("weekly-panel-enter");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => dayPanelEl.classList.add("weekly-panel-enter"));
    });
  } else {
    dayPanelEl.classList.add("weekly-panel-enter");
  }

  lastSet = null; // animatsiya faqat bir marta ko'rsatiladi
  updateProgress();
  renderDayTabs(); // nuqtachalar (to'ldirilgan/qisman) yangilanishi uchun
}

// Event delegation: panel har safar qayta chizilsa ham, bitta doimiy
// listener orqali bosishlarni ushlaymiz. "click" ishlatiladi — brauzer
// buni faqat haqiqiy bosishda ishga tushiradi, surishda esa bekor qiladi.
dayPanelEl.addEventListener("click", (e) => {
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
    <div class="picker-item" data-picker-id="${escapeHtml(r.id)}">
      <div class="recipe-thumb recipe-thumb--sm">
        ${r.imageUrl ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}">` : "🍽️"}
      </div>
      <p class="picker-item-title">${escapeHtml(displayTitle(r))}</p>
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
  if (day === selectedDay) renderDayPanel({ animate: false });
  else { renderDayTabs(); updateProgress(); }
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
// Avval keshdan (bor bo'lsa) darrov ko'rsatamiz — server javobini kutmasdan.
const cachedMenu = getCachedMenu();
if (cachedMenu) currentMenu = cachedMenu;

selectedDay = getTodayKey(); // har doim BUGUNGI kundan boshlanadi
renderDayTabs();
renderDayPanel();

loadRecipesWithCache((recipes) => {
  allRecipes = recipes;
  renderDayPanel();
  if (activeDay) renderPickerList(applyPickerFilter());
});

if (tg?.initData) {
  fetch(`/api/weekly-menu?initData=${encodeURIComponent(tg.initData)}`)
    .then(res => res.ok ? res.json() : { days: {} })
    .then(data => {
      currentMenu = data.days || {};
      setCachedMenu(currentMenu);
      renderDayTabs();
      renderDayPanel();
    })
    .catch(() => {
      // Internet yo'q — keshdan ko'rsatilgan holatda qoladi
    });
}
