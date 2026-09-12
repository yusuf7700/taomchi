// ===== Taomchi — Haftalik ovqat rejasi ("Bitta kunga e'tibor" ko'rinishi) =====
// Bu reja endi kun NOMIGA emas, haqiqiy SANAGA bog'langan (masalan
// "2026-09-14"), shuning uchun har hafta boshqa taom rejalashtirish mumkin.
// Foydalanuvchi "◀ / ▶" tugmalari orqali haftalar orasida o'tadi.

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

const WEEKLY_CACHE_KEY = "taomchi_weekly_menu_cache_v2";

// Haftalar orasida qanchagacha siljish mumkinligi (haddan tashqari
// uzoqqa ketib, ma'lumotlar bazasini keraksiz to'ldirmaslik uchun)
const MIN_WEEK_OFFSET = -8;
const MAX_WEEK_OFFSET = 12;

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
const weekLabelEl = document.getElementById("weekLabel");
const weekPrevBtn = document.getElementById("weekPrevBtn");
const weekNextBtn = document.getElementById("weekNextBtn");

let currentMenu = {}; // { "2026-09-14": { lunch: recipeId, dinner: recipeId }, ... }
let allRecipes = [];
let weekOffset = 0;       // 0 = joriy hafta, 1 = keyingi hafta, -1 = o'tgan hafta ...
let selectedDayIndex = null; // 0(Dush)..6(Yak) — joriy ko'rsatilayotgan haftada tanlangan kun
let activeDateKey = null; // retsept tanlash oynasi qaysi sana uchun ochilgan
let activeMeal = null;
let lastSet = null; // { dateKey, meal } — animatsiya uchun

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

// ===== Sana yordamchilari (O'zbekiston vaqti, UTC+5) =====
function tashkentNow() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000);
}

function dateKeyOf(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Berilgan weekOffset uchun o'sha haftaning Dushanba sanasini qaytaradi
function getMondayForOffset(offset) {
  const now = tashkentNow();
  const dow = now.getUTCDay(); // 0=Yak..6=Shan
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() + diffToMonday + offset * 7);
  return monday;
}

// Joriy weekOffset uchun 7 ta sanani (Dush..Yak) qaytaradi
function getCurrentWeekDates() {
  const monday = getMondayForOffset(weekOffset);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    dates.push(d);
  }
  return dates;
}

function getTodayDateKey() {
  return dateKeyOf(tashkentNow());
}

function formatShortDate(d) {
  return `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
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

function isDayFilled(dateKey) {
  const d = currentMenu[dateKey] || {};
  return !!(d.lunch && d.dinner);
}

function isDayPartial(dateKey) {
  const d = currentMenu[dateKey] || {};
  return !!(d.lunch || d.dinner) && !isDayFilled(dateKey);
}

function updateProgress() {
  const weekDates = getCurrentWeekDates();
  let filled = 0;
  weekDates.forEach(d => {
    const dk = dateKeyOf(d);
    const dd = currentMenu[dk] || {};
    if (dd.lunch) filled++;
    if (dd.dinner) filled++;
  });
  const total = weekDates.length * MEALS.length;
  progressFill.style.width = `${Math.round((filled / total) * 100)}%`;
  progressText.textContent = `${filled}/${total}`;
}

// ===== Hafta almashtirish qatori =====
function renderWeekNav() {
  if (weekOffset === 0) weekLabelEl.textContent = t("weekly_this_week", "Bu hafta");
  else if (weekOffset === 1) weekLabelEl.textContent = t("weekly_next_week", "Keyingi hafta");
  else if (weekOffset === -1) weekLabelEl.textContent = t("weekly_prev_week", "O'tgan hafta");
  else {
    const dates = getCurrentWeekDates();
    weekLabelEl.textContent = `${formatShortDate(dates[0])} – ${formatShortDate(dates[6])}`;
  }
  weekPrevBtn.disabled = weekOffset <= MIN_WEEK_OFFSET;
  weekNextBtn.disabled = weekOffset >= MAX_WEEK_OFFSET;
}

function changeWeek(delta) {
  const next = weekOffset + delta;
  if (next < MIN_WEEK_OFFSET || next > MAX_WEEK_OFFSET) return;
  weekOffset = next;
  renderWeekNav();
  renderDayTabs();
  renderDayPanel({ animate: true });
}

weekPrevBtn.addEventListener("click", () => changeWeek(-1));
weekNextBtn.addEventListener("click", () => changeWeek(1));

// ===== Kun tugmalari (tepadagi tab'lar) =====
function renderDayTabs() {
  const weekDates = getCurrentWeekDates();
  const todayKey = getTodayDateKey();

  dayTabsEl.innerHTML = weekDates.map((d, i) => {
    const dk = dateKeyOf(d);
    const day = DAYS[i];
    const isActive = i === selectedDayIndex;
    const isToday = dk === todayKey;
    let dotClass = "";
    if (isDayFilled(dk)) dotClass = "weekly-tab-dot--full";
    else if (isDayPartial(dk)) dotClass = "weekly-tab-dot--partial";

    return `
      <button class="weekly-day-tab ${isActive ? "weekly-day-tab--active" : ""}" data-tab-index="${i}">
        ${isToday ? `<span class="weekly-tab-today-mark"></span>` : ""}
        <span>${t(DAY_SHORT_KEYS[day])}</span>
        ${dotClass ? `<span class="weekly-tab-dot ${dotClass}"></span>` : ""}
      </button>
    `;
  }).join("");

  const activeTabEl = dayTabsEl.querySelector(".weekly-day-tab--active");
  if (activeTabEl) activeTabEl.scrollIntoView({ inline: "center", block: "nearest" });
}

dayTabsEl.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-tab-index]");
  if (!tab) return;
  selectDayIndex(Number(tab.getAttribute("data-tab-index")));
});

function selectDayIndex(index) {
  if (index === selectedDayIndex) return;
  selectedDayIndex = index;
  renderDayTabs();
  renderDayPanel({ animate: true });
}

// ===== Tanlangan kunning paneli (Tushlik + Kechki ovqat) =====
function renderMealSlot(dateKey, meal) {
  const dayData = currentMenu[dateKey] || {};
  const recipeId = dayData[meal];
  const recipe = recipeId ? findRecipe(recipeId) : null;
  const justSet = lastSet && lastSet.dateKey === dateKey && lastSet.meal === meal;
  const mealLabel = `${MEAL_ICONS[meal]} ${t(MEAL_LABEL_KEYS[meal])}`;

  if (recipe) {
    return `
      <div class="weekly-meal-slot">
        <p class="weekly-meal-label">${mealLabel}</p>
        <div class="weekly-day-card ${justSet ? "weekly-day-card--pop" : ""}" data-date-select="${dateKey}" data-meal-select="${meal}">
          <div class="recipe-thumb recipe-thumb--sm">
            ${recipe.imageUrl ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}">` : "🍽️"}
          </div>
          <p class="weekly-day-recipe-title">${escapeHtml(displayTitle(recipe))}</p>
          <button class="weekly-day-clear" data-date-clear="${dateKey}" data-meal-clear="${meal}">✕</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="weekly-meal-slot">
      <p class="weekly-meal-label">${mealLabel}</p>
      <button class="weekly-day-empty" data-date-select="${dateKey}" data-meal-select="${meal}">+ ${t("weekly_choose", "Retsept tanlash")}</button>
    </div>
  `;
}

function renderDayPanel(opts = {}) {
  const weekDates = getCurrentWeekDates();
  const day = DAYS[selectedDayIndex];
  const date = weekDates[selectedDayIndex];
  const dk = dateKeyOf(date);
  const todayKey = getTodayDateKey();
  const isToday = dk === todayKey;

  dayPanelEl.innerHTML = `
    <p class="weekly-panel-title">${t(DAY_LABEL_KEYS[day])} <span class="weekly-panel-date">${formatShortDate(date)}</span>${isToday ? `<span class="weekly-today-badge">${t("weekly_today", "Bugun")}</span>` : ""}</p>
    ${renderMealSlot(dk, "lunch")}
    ${renderMealSlot(dk, "dinner")}
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
// listener orqali bosishlarni ushlaymiz.
dayPanelEl.addEventListener("click", (e) => {
  const clearBtn = e.target.closest("[data-date-clear]");
  if (clearBtn) {
    setMeal(clearBtn.getAttribute("data-date-clear"), clearBtn.getAttribute("data-meal-clear"), null);
    return;
  }
  const selectEl = e.target.closest("[data-date-select]");
  if (selectEl) {
    openPicker(selectEl.getAttribute("data-date-select"), selectEl.getAttribute("data-meal-select"));
  }
});

// ===== Retsept tanlash ko'rinishi (sahifa ichida, oyna emas) =====
function openPicker(dateKey, meal) {
  activeDateKey = dateKey;
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
  activeDateKey = null;
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
  if (!item || !activeDateKey || !activeMeal) return;
  setMeal(activeDateKey, activeMeal, item.getAttribute("data-picker-id"));
  closePicker();
});

pickerBackBtn.addEventListener("click", closePicker);

// ===== Saqlash (server bilan sinxron) =====
async function setMeal(dateKey, meal, recipeId) {
  currentMenu = {
    ...currentMenu,
    [dateKey]: { ...(currentMenu[dateKey] || {}), [meal]: recipeId }
  };
  lastSet = recipeId ? { dateKey, meal } : null;

  const weekDates = getCurrentWeekDates();
  const selectedKey = selectedDayIndex !== null ? dateKeyOf(weekDates[selectedDayIndex]) : null;
  if (dateKey === selectedKey) renderDayPanel({ animate: false });
  else { renderDayTabs(); updateProgress(); }
  setCachedMenu(currentMenu);

  if (!tg?.initData) return; // Telegram tashqarisida ochilgan bo'lishi mumkin
  try {
    await fetch("/api/weekly-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, date: dateKey, meal, recipeId })
    });
  } catch {
    // Internet yo'q bo'lishi mumkin — UI holati saqlanadi, keyingi ochilishda qayta yuklanadi
  }
}

// ===== Boshlang'ich yuklash =====
// Avval keshdan (bor bo'lsa) darrov ko'rsatamiz — server javobini kutmasdan.
const cachedMenu = getCachedMenu();
if (cachedMenu) currentMenu = cachedMenu;

// Har doim BUGUNGI kundan (joriy haftaning mos ustunidan) boshlanadi
(function initSelectedDay() {
  const now = tashkentNow();
  const dow = now.getUTCDay(); // 0=Yak..6=Shan
  selectedDayIndex = dow === 0 ? 6 : dow - 1; // 0=Dush index bilan mos
})();

renderWeekNav();
renderDayTabs();
renderDayPanel();

loadRecipesWithCache((recipes) => {
  allRecipes = recipes;
  renderDayPanel();
  if (activeDateKey) renderPickerList(applyPickerFilter());
});

if (tg?.initData) {
  fetch(`/api/weekly-menu?initData=${encodeURIComponent(tg.initData)}`)
    .then(res => res.ok ? res.json() : { days: {} })
    .then(data => {
      currentMenu = data.days || {};
      setCachedMenu(currentMenu);
      renderWeekNav();
      renderDayTabs();
      renderDayPanel();
    })
    .catch(() => {
      // Internet yo'q — keshdan ko'rsatilgan holatda qoladi
    });
}
