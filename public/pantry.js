// ===== Taomchi — "Uyda nima bor?" sahifasi =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const PANTRY_STORAGE_KEY = "taomchi_pantry_selected";
const chipContainer = document.getElementById("pantryChips");
const resultSection = document.getElementById("pantryResults");
const selectedCountEl = document.getElementById("selectedCount");
const clearBtn = document.getElementById("clearPantryBtn");

let selectedIds = new Set(loadSelected());
let allRecipes = [];
let pantryIngredients = []; // Firestore'dan (yoki zaxiradan) yuklanadi

function loadSelected() {
  try {
    const raw = localStorage.getItem(PANTRY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSelected() {
  try {
    localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify([...selectedIds]));
  } catch {
    // localStorage to'lib qolgan bo'lishi mumkin, e'tiborsiz qoldiramiz
  }
}

function t(key, fallback) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return dict[key] || fallback || key;
}

// Mahsulotlarni guruhlarga ajratib, PANTRY_GROUP_ORDER tartibida qaytaradi
function groupPantryIngredients(items) {
  const byGroup = {};
  for (const item of items) {
    const g = item.groupId || "other";
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(item);
  }
  const orderedGroupIds = [
    ...PANTRY_GROUP_ORDER.filter(g => byGroup[g]),
    ...Object.keys(byGroup).filter(g => !PANTRY_GROUP_ORDER.includes(g))
  ];
  return orderedGroupIds.map(groupId => ({
    id: groupId,
    label: PANTRY_GROUP_LABELS[groupId] || "Boshqa mahsulotlar",
    items: byGroup[groupId]
  }));
}

// ===== Mahsulot chip'larini chizish =====
function renderChips() {
  const groups = groupPantryIngredients(pantryIngredients);

  chipContainer.innerHTML = groups.map(group => `
    <div class="pantry-group">
      <p class="pantry-group-title">${displayText(group.label)}</p>
      <div class="pantry-chip-row">
        ${group.items.map(item => `
          <button class="ingredient-chip ${selectedIds.has(item.id) ? "selected" : ""}" data-id="${item.id}">
            <span>${item.emoji}</span> ${displayText(item.label)}
          </button>
        `).join("")}
      </div>
    </div>
  `).join("");

  chipContainer.querySelectorAll(".ingredient-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const id = chip.getAttribute("data-id");
      if (selectedIds.has(id)) {
        selectedIds.delete(id);
      } else {
        selectedIds.add(id);
      }
      chip.classList.toggle("selected");
      saveSelected();
      updateSelectedCount();
      renderResults();
    });
  });
}

function updateSelectedCount() {
  selectedCountEl.textContent = selectedIds.size;
}

// ===== Natijalarni chizish =====
function missingNames(ids) {
  return ids.map(id => {
    const item = pantryIngredients.find(i => i.id === id);
    return item ? displayText(item.label) : id;
  });
}

function recipeResultCard(m) {
  const r = m.recipe;
  const missingText = m.status === "partial"
    ? `<p class="missing-text">${missingNames(m.missing).join(", ")} ${t("pantry_missing_suffix", "yetishmayapti")}</p>`
    : "";
  return `
    <div class="recipe-card" data-id="${r.id}">
      <div class="recipe-thumb">
        ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}">` : "🍽️"}
      </div>
      <div class="recipe-info">
        <p class="recipe-title">${displayTitle(r)}</p>
        <p class="recipe-meta"><span>⏱ ${formatCookTime(r)}</span>${difficultyBadge(r)}</p>
        ${missingText}
      </div>
      <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  `;
}

function renderResults() {
  if (pantryIngredients.length === 0) {
    resultSection.innerHTML = `<p class="empty-text">Yuklanmoqda...</p>`;
    return;
  }

  if (selectedIds.size === 0) {
    resultSection.innerHTML = `<p class="empty-text">${t("pantry_empty_hint")}</p>`;
    return;
  }

  const matched = [];
  for (const r of allRecipes) {
    const m = matchRecipe(r, selectedIds, pantryIngredients);
    if (m) matched.push({ recipe: r, ...m });
  }

  const fullMatches = matched.filter(m => m.status === "full");
  const partialMatches = matched
    .filter(m => m.status === "partial" && m.missing.length <= 3)
    .sort((a, b) => a.missing.length - b.missing.length);

  if (fullMatches.length === 0 && partialMatches.length === 0) {
    resultSection.innerHTML = `<p class="empty-text">${t("pantry_no_match")}</p>`;
    return;
  }

  let html = "";
  if (fullMatches.length > 0) {
    html += `<p class="pantry-result-title">${t("pantry_full_title")}</p>`;
    html += fullMatches.map(recipeResultCard).join("");
  }
  if (partialMatches.length > 0) {
    html += `<p class="pantry-result-title">${t("pantry_partial_title")}</p>`;
    html += partialMatches.map(recipeResultCard).join("");
  }
  resultSection.innerHTML = html;

  resultSection.querySelectorAll(".recipe-card").forEach(card => {
    card.addEventListener("click", () => {
      window.location.href = `recipe-detail.html?id=${card.getAttribute("data-id")}`;
    });
  });
}

clearBtn.addEventListener("click", () => {
  selectedIds.clear();
  saveSelected();
  renderChips();
  updateSelectedCount();
  renderResults();
});

// ===== Boshlang'ich yuklash =====
updateSelectedCount();
renderResults();

loadPantryIngredientsWithCache((items) => {
  pantryIngredients = items && items.length > 0 ? items : PANTRY_FALLBACK_INGREDIENTS;
  renderChips();
  renderResults();
});

loadRecipesWithCache((recipes) => {
  allRecipes = recipes;
  renderResults();
});
