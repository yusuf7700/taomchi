// ===== Taomchi — Haftalik ovqat rejasi =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL_KEYS = {
  mon: "day_mon", tue: "day_tue", wed: "day_wed", thu: "day_thu",
  fri: "day_fri", sat: "day_sat", sun: "day_sun"
};

const dayListView = document.getElementById("dayListView");
const pickerView = document.getElementById("pickerView");
const weeklyDayList = document.getElementById("weeklyDayList");
const pickerList = document.getElementById("pickerList");
const pickerBackBtn = document.getElementById("pickerBackBtn");

let currentMenu = {}; // { mon: recipeId, ... }
let allRecipes = [];
let activeDay = null; // hozir tanlanayotgan kun

function t(key, fallback) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return dict[key] || fallback || key;
}

function findRecipe(id) {
  return allRecipes.find(r => r.id === id);
}

// ===== Kunlar ro'yxatini chizish =====
function renderDays() {
  weeklyDayList.innerHTML = DAYS.map(day => {
    const recipeId = currentMenu[day];
    const recipe = recipeId ? findRecipe(recipeId) : null;

    if (recipe) {
      return `
        <div class="weekly-day-row" data-day="${day}">
          <p class="weekly-day-label">${t(DAY_LABEL_KEYS[day])}</p>
          <div class="weekly-day-card" data-day-select="${day}">
            <div class="recipe-thumb recipe-thumb--sm">
              ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.title}">` : "🍽️"}
            </div>
            <p class="weekly-day-recipe-title">${displayTitle(recipe)}</p>
            <button class="weekly-day-clear" data-day-clear="${day}">✕</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="weekly-day-row" data-day="${day}">
        <p class="weekly-day-label">${t(DAY_LABEL_KEYS[day])}</p>
        <button class="weekly-day-empty" data-day-select="${day}">+ ${t("weekly_choose", "Retsept tanlash")}</button>
      </div>
    `;
  }).join("");
}

// Event delegation: kunlar ro'yxati har safar qayta chizilsa ham,
// bitta doimiy listener orqali bosishlarni ushlaymiz.
weeklyDayList.addEventListener("pointerdown", (e) => {
  const clearBtn = e.target.closest("[data-day-clear]");
  if (clearBtn) {
    setDay(clearBtn.getAttribute("data-day-clear"), null);
    return;
  }
  const selectEl = e.target.closest("[data-day-select]");
  if (selectEl) {
    openPicker(selectEl.getAttribute("data-day-select"));
  }
});

// Haftalik rejaga faqat asosiy taomlar va sho'rvalar tavsiya qilinadi —
// shirinlik, ichimlik, salat kabi kategoriyalar kunlik ovqat rejasiga mos
// kelmaydi.
const WEEKLY_CATEGORIES = ["main", "soup"];

function getPickableRecipes() {
  return allRecipes.filter(r => WEEKLY_CATEGORIES.includes(r.category));
}

// ===== Retsept tanlash ko'rinishi (sahifa ichida, oyna emas) =====
function openPicker(day) {
  activeDay = day;
  renderPickerList(getPickableRecipes());
  dayListView.classList.add("screen-hidden");
  pickerView.classList.remove("screen-hidden");
  window.scrollTo(0, 0);
}

function closePicker() {
  pickerView.classList.add("screen-hidden");
  dayListView.classList.remove("screen-hidden");
  activeDay = null;
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

pickerList.addEventListener("pointerdown", (e) => {
  const item = e.target.closest("[data-picker-id]");
  if (!item || !activeDay) return;
  setDay(activeDay, item.getAttribute("data-picker-id"));
  closePicker();
});

pickerBackBtn.addEventListener("pointerdown", closePicker);

// ===== Saqlash (server bilan sinxron) =====
async function setDay(day, recipeId) {
  currentMenu = { ...currentMenu, [day]: recipeId };
  renderDays();

  if (!tg?.initData) return; // Telegram tashqarisida ochilgan bo'lishi mumkin
  try {
    await fetch("/api/weekly-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, day, recipeId })
    });
  } catch {
    // Internet yo'q bo'lishi mumkin — UI holati saqlanadi, keyingi ochilishda qayta yuklanadi
  }
}

// ===== Boshlang'ich yuklash =====
renderDays(); // recipe'lar hali kelmagan bo'lsa ham bo'sh joylarni ko'rsatib turadi

loadRecipesWithCache((recipes) => {
  allRecipes = recipes;
  renderDays();
  // Agar retsept tanlash ko'rinishi ochiq turgan bo'lsa (retseptlar hali
  // yuklanmagan payt ochilgan bo'lishi mumkin), ro'yxatni ham yangilaymiz
  if (activeDay) renderPickerList(getPickableRecipes());
});

if (tg?.initData) {
  fetch(`/api/weekly-menu?initData=${encodeURIComponent(tg.initData)}`)
    .then(res => res.ok ? res.json() : { days: {} })
    .then(data => {
      currentMenu = data.days || {};
      renderDays();
    })
    .catch(() => {
      // Internet yo'q — bo'sh holatda qoladi
    });
}
