// ===== Taomchi — "Uyda nima bor?" sahifasi =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const PANTRY_STORAGE_KEY = "taomchi_pantry_selected";
const chipContainer = document.getElementById("pantryChips");
const resultSection = document.getElementById("pantryResults");
const selectedCountEl = document.getElementById("selectedCount");
const clearBtn = document.getElementById("clearPantryBtn");
const searchInput = document.getElementById("pantrySearchInput");
const selectedRowEl = document.getElementById("pantrySelectedRow");
const floatBtn = document.getElementById("pantryResultsFloatBtn");

let selectedIds = new Set(loadSelected());
let allRecipes = [];
let lastMatchCount = 0;

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

// ===== Mahsulot chip'larini chizish =====
function renderChips() {
  chipContainer.innerHTML = PANTRY_GROUPS.map(group => `
    <div class="pantry-group" data-group-id="${group.id}">
      <p class="pantry-group-title">${displayText(group.label)}</p>
      <div class="pantry-chip-row">
        ${group.items.map(item => `
          <button class="ingredient-chip ${selectedIds.has(item.id) ? "selected" : ""}" data-id="${item.id}" data-label="${displayText(item.label).toLowerCase()}">
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
      renderSelectedRow();
      renderResults();
    });
  });

  applyPantrySearch();
}

function updateSelectedCount() {
  selectedCountEl.textContent = selectedIds.size;
}

// ===== Qidiruv (72 ta mahsulot orasidan tez topish uchun) =====
function applyPantrySearch() {
  const q = cyrillicToLatin((searchInput.value || "").trim().toLowerCase());
  chipContainer.querySelectorAll(".pantry-group").forEach(groupEl => {
    let visibleCount = 0;
    groupEl.querySelectorAll(".ingredient-chip").forEach(chip => {
      const label = cyrillicToLatin(chip.getAttribute("data-label"));
      const match = !q || label.includes(q);
      chip.classList.toggle("screen-hidden", !match);
      if (match) visibleCount++;
    });
    groupEl.classList.toggle("screen-hidden", visibleCount === 0);
  });
}

searchInput.addEventListener("input", applyPantrySearch);

// ===== Tanlangan mahsulotlar qatori (doim yuqorida ko'rinadi) =====
function renderSelectedRow() {
  if (selectedIds.size === 0) {
    selectedRowEl.classList.add("screen-hidden");
    selectedRowEl.innerHTML = "";
    return;
  }

  selectedRowEl.classList.remove("screen-hidden");
  selectedRowEl.innerHTML = [...selectedIds].map(id => {
    const item = PANTRY_INGREDIENTS.find(i => i.id === id);
    if (!item) return "";
    return `
      <span class="pantry-selected-chip">
        ${item.emoji} ${displayText(item.label)}
        <button data-remove-id="${id}" aria-label="O'chirish">✕</button>
      </span>
    `;
  }).join("");

  selectedRowEl.querySelectorAll("[data-remove-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-remove-id");
      selectedIds.delete(id);
      saveSelected();
      updateSelectedCount();
      renderSelectedRow();
      renderChips();
      renderResults();
    });
  });
}

// ===== Natijalarni chizish =====
function missingNames(ids) {
  return ids.map(id => {
    const item = PANTRY_INGREDIENTS.find(i => i.id === id);
    return item ? displayText(item.label) : id;
  });
}

function recipeResultCard(m) {
  const r = m.recipe;
  const missingText = m.status === "partial"
    ? `<p class="missing-text">${missingNames(m.missing).join(", ")} ${t("pantry_missing_suffix", "yetishmayapti")}</p>`
    : "";
  return `
    <div class="recipe-card" data-id="${escapeHtml(r.id)}">
      <div class="recipe-thumb">
        ${r.imageUrl ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}">` : "🍽️"}
        ${premiumRibbon(r)}
      </div>
      <div class="recipe-info">
        <p class="recipe-title">${escapeHtml(displayTitle(r))}</p>
        <p class="recipe-meta"><span>⏱ ${formatCookTime(r)}</span>${difficultyBadge(r)}</p>
        ${missingText}
      </div>
      <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  `;
}

function renderResults() {
  if (selectedIds.size === 0) {
    resultSection.innerHTML = `<p class="empty-text">${t("pantry_empty_hint")}</p>`;
    updateFloatBtn(0);
    return;
  }

  const matched = [];
  for (const r of allRecipes) {
    const m = matchRecipe(r, selectedIds);
    if (m) matched.push({ recipe: r, ...m });
  }

  const fullMatches = matched.filter(m => m.status === "full");
  const partialMatches = matched
    .filter(m => m.status === "partial" && m.missing.length <= 3)
    .sort((a, b) => a.missing.length - b.missing.length);

  if (fullMatches.length === 0 && partialMatches.length === 0) {
    resultSection.innerHTML = `<p class="empty-text">${t("pantry_no_match")}</p>`;
    updateFloatBtn(0);
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

  updateFloatBtn(fullMatches.length + partialMatches.length);
}

// ===== Pastda suzuvchi "Natijalarni ko'rish" tugmasi =====
function updateFloatBtn(count) {
  lastMatchCount = count;
  if (count === 0) {
    floatBtn.classList.add("screen-hidden");
    return;
  }
  floatBtn.textContent = `${count} ${t("pantry_results_found", "ta retsept topildi")} →`;
  floatBtn.classList.remove("screen-hidden");
}

floatBtn.addEventListener("click", () => {
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

clearBtn.addEventListener("click", () => {
  selectedIds.clear();
  saveSelected();
  renderChips();
  renderSelectedRow();
  updateSelectedCount();
  renderResults();
});

// ===== Boshlang'ich yuklash =====
renderChips();
renderSelectedRow();
updateSelectedCount();
renderResults();

loadRecipesWithCache((recipes) => {
  allRecipes = recipes;
  renderResults();
});
