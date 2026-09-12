// ===== Taomchi — "Uyda nima bor?" sahifasi =====
// 2 bosqichli oqim: 1) mahsulot tanlash (kategoriya tab + qidiruv +
// grid), 2) natijalar (alohida ekran, "Retseptlarni ko'rish" tugmasi
// orqali ochiladi). Bu naycha 72 ta mahsulotni bitta uzun ro'yxatda
// ko'rsatish o'rniga, kategoriya bo'yicha bo'lib beradi.

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const PANTRY_STORAGE_KEY = "taomchi_pantry_selected";

const selectionView = document.getElementById("selectionView");
const resultsView = document.getElementById("resultsView");
const resultsBackBtn = document.getElementById("resultsBackBtn");
const chipContainer = document.getElementById("pantryChips");
const categoryTabsEl = document.getElementById("pantryCategoryTabs");
const resultSection = document.getElementById("pantryResults");
const searchInput = document.getElementById("pantrySearchInput");
const selectedRowEl = document.getElementById("pantrySelectedRow");
const ctaBar = document.getElementById("pantryCtaBar");
const ctaBtn = document.getElementById("pantryCtaBtn");

let selectedIds = new Set(loadSelected());
let allRecipes = [];
let activeCategory = PANTRY_GROUPS[0].id;

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

// ===== Kategoriya tab'lari ("Barchasi" + har bir guruh) =====
function renderCategoryTabs() {
  const tabs = PANTRY_GROUPS
    .map(g => ({ id: g.id, label: `${g.emoji} ${displayText(g.shortLabel)}` }))
    .concat([{ id: "all", label: t("pantry_all_category", "Barchasi") }]);

  categoryTabsEl.innerHTML = tabs.map(tab => `
    <button class="filter-chip ${activeCategory === tab.id ? "active" : ""}" data-cat="${tab.id}">${tab.label}</button>
  `).join("");

  categoryTabsEl.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.getAttribute("data-cat");
      renderCategoryTabs();
      renderGrid();
    });
  });
}

// ===== Mahsulot grid'i (tanlangan kategoriya + qidiruv bo'yicha) =====
function getVisibleItems() {
  const q = cyrillicToLatin((searchInput.value || "").trim().toLowerCase());

  let groups = PANTRY_GROUPS;
  if (!q && activeCategory !== "all") {
    groups = PANTRY_GROUPS.filter(g => g.id === activeCategory);
  }

  const items = groups.flatMap(g => g.items);
  if (!q) return items;

  return items.filter(item => cyrillicToLatin(displayText(item.label).toLowerCase()).includes(q));
}

function renderGrid() {
  const items = getVisibleItems();

  if (items.length === 0) {
    chipContainer.innerHTML = `<p class="empty-text">${t("weekly_no_results", "Hech narsa topilmadi")}</p>`;
    return;
  }

  chipContainer.innerHTML = items.map(item => `
    <button class="pantry-grid-item ${selectedIds.has(item.id) ? "selected" : ""}" data-id="${item.id}">
      <span class="pantry-grid-emoji">${item.emoji}</span>
      <span class="pantry-grid-label">${displayText(item.label)}</span>
    </button>
  `).join("");

  chipContainer.querySelectorAll(".pantry-grid-item").forEach(el => {
    el.addEventListener("click", () => toggleItem(el.getAttribute("data-id")));
  });
}

function toggleItem(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  saveSelected();
  renderGrid();
  renderSelectedRow();
  renderCta();
}

searchInput.addEventListener("input", renderGrid);

// ===== Tanlangan mahsulotlar qatori (doim yuqorida ko'rinadi) =====
function renderSelectedRow() {
  if (selectedIds.size === 0) {
    selectedRowEl.classList.add("screen-hidden");
    selectedRowEl.innerHTML = "";
    return;
  }

  selectedRowEl.classList.remove("screen-hidden");

  const chipsHtml = [...selectedIds].map(id => {
    const item = PANTRY_INGREDIENTS.find(i => i.id === id);
    if (!item) return "";
    return `
      <span class="pantry-selected-chip">
        ${item.emoji} ${displayText(item.label)}
        <button data-remove-id="${id}" aria-label="O'chirish">✕</button>
      </span>
    `;
  }).join("");

  selectedRowEl.innerHTML = `
    <div class="pantry-selected-header">
      <span>${selectedIds.size} ${t("pantry_selected", "ta mahsulot tanlandi")}</span>
      <button id="clearPantryBtn" class="pantry-clear-btn">${t("pantry_clear", "Tozalash")}</button>
    </div>
    <div class="pantry-selected-chips">${chipsHtml}</div>
  `;

  selectedRowEl.querySelectorAll("[data-remove-id]").forEach(btn => {
    btn.addEventListener("click", () => toggleItem(btn.getAttribute("data-remove-id")));
  });

  document.getElementById("clearPantryBtn").addEventListener("click", () => {
    selectedIds.clear();
    saveSelected();
    renderGrid();
    renderSelectedRow();
    renderCta();
  });
}

// ===== Moslikni hisoblash (tanlash va natijalar ekrani baham ko'radi) =====
function computeMatches() {
  const matched = [];
  for (const r of allRecipes) {
    const m = matchRecipe(r, selectedIds);
    if (m) matched.push({ recipe: r, ...m });
  }
  const fullMatches = matched.filter(m => m.status === "full");
  const partialMatches = matched
    .filter(m => m.status === "partial" && m.missing.length <= 3)
    .sort((a, b) => a.missing.length - b.missing.length);
  return { fullMatches, partialMatches };
}

// ===== Pastki chaqiruv paneli =====
function renderCta() {
  if (selectedIds.size === 0) {
    ctaBar.classList.add("screen-hidden");
    return;
  }
  ctaBar.classList.remove("screen-hidden");
  const { fullMatches, partialMatches } = computeMatches();
  const count = fullMatches.length + partialMatches.length;
  ctaBtn.textContent = count > 0
    ? `${count} ${t("pantry_results_found", "ta retsept topildi")} →`
    : t("pantry_view_results", "Retseptlarni ko'rish");
}

// ===== Natijalar ekrani =====
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

function renderResultsContent() {
  const { fullMatches, partialMatches } = computeMatches();

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

// ===== Ekranlar orasida o'tish =====
function showResultsView() {
  renderResultsContent();
  selectionView.classList.add("screen-hidden");
  ctaBar.classList.add("screen-hidden");
  resultsView.classList.remove("screen-hidden");
  resultsView.classList.remove("view-enter");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => resultsView.classList.add("view-enter"));
  });
  window.scrollTo(0, 0);
}

function showSelectionView() {
  resultsView.classList.add("screen-hidden");
  resultsView.classList.remove("view-enter");
  selectionView.classList.remove("screen-hidden");
  renderCta();
}

ctaBtn.addEventListener("click", showResultsView);
resultsBackBtn.addEventListener("click", showSelectionView);

// ===== Boshlang'ich yuklash =====
renderCategoryTabs();
renderGrid();
renderSelectedRow();
renderCta();

loadRecipesWithCache((recipes) => {
  allRecipes = recipes;
  renderCta();
  if (!resultsView.classList.contains("screen-hidden")) renderResultsContent();
});
