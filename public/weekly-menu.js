// ===== Taomchi — Haftalik ovqat rejasi =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL_KEYS = {
  mon: "day_mon", tue: "day_tue", wed: "day_wed", thu: "day_thu",
  fri: "day_fri", sat: "day_sat", sun: "day_sun"
};

const dayListEl = document.getElementById("weeklyDayList");
const pickerOverlay = document.getElementById("recipePickerOverlay");
const pickerList = document.getElementById("pickerList");
const pickerSearch = document.getElementById("pickerSearch");
const pickerCancelBtn = document.getElementById("pickerCancelBtn");

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
  dayListEl.innerHTML = DAYS.map(day => {
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

  dayListEl.querySelectorAll("[data-day-select]").forEach(el => {
    el.addEventListener("click", () => openPicker(el.getAttribute("data-day-select")));
  });
  dayListEl.querySelectorAll("[data-day-clear]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setDay(btn.getAttribute("data-day-clear"), null);
    });
  });
}

// ===== Retsept tanlash oynasi =====
function openPicker(day) {
  activeDay = day;
  pickerSearch.value = "";
  renderPickerList(allRecipes);
  pickerOverlay.classList.remove("screen-hidden");
  pickerSearch.focus();
}

function closePicker() {
  pickerOverlay.classList.add("screen-hidden");
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

  pickerList.querySelectorAll("[data-picker-id]").forEach(el => {
    el.addEventListener("click", () => {
      setDay(activeDay, el.getAttribute("data-picker-id"));
      closePicker();
    });
  });
}

pickerSearch.addEventListener("input", () => {
  const q = pickerSearch.value.trim().toLowerCase();
  if (!q) {
    renderPickerList(allRecipes);
    return;
  }
  const filtered = allRecipes.filter(r => (r.title || "").toLowerCase().includes(q));
  renderPickerList(filtered);
});

pickerCancelBtn.addEventListener("click", closePicker);
pickerOverlay.addEventListener("click", (e) => {
  if (e.target === pickerOverlay) closePicker();
});

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
