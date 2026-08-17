// ===== Taomchi — Retseptlar ro'yxati =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const recipeListEl = document.getElementById("recipeList");
const filterRow = document.getElementById("filterRow");
const searchInput = document.getElementById("searchInput");

let allRecipes = [];
let currentFilter = "all";

// Kategoriya nomini joriy tildagi tarjimaga aylantirish (kartalarda ko'rsatish uchun)
function categoryLabel(cat) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return dict["cat_" + cat] || cat;
}

function renderRecipes(list) {
  if (list.length === 0) {
    const lang = getCurrentLang();
    const emptyText = lang === "uz"
      ? "Hozircha bu bo'limda retsept yo'q."
      : "Ҳозирча бу бўлимда рецепт йўқ.";
    recipeListEl.innerHTML = `<p class="empty-text">${emptyText}</p>`;
    return;
  }

  recipeListEl.innerHTML = list.map(r => `
    <div class="recipe-card" data-id="${r.id}">
      <div class="recipe-thumb">
        ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}">` : "🍽️"}
      </div>
      <div class="recipe-info">
        <p class="recipe-title">${displayTitle(r)}</p>
        <p class="recipe-meta">
          <span>⏱ ${formatCookTime(r)}</span>
          <span>⭐ ${r.rating || "-"}</span>
        </p>
        <span class="recipe-category-badge">${categoryLabel(r.category)}</span>
      </div>
      <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  `).join("");

  document.querySelectorAll(".recipe-card").forEach(card => {
    card.addEventListener("click", () => {
      window.location.href = `recipe-detail.html?id=${card.getAttribute("data-id")}`;
    });
  });
}

function applyFilters() {
  const query = cyrillicToLatin(searchInput.value.trim().toLowerCase());
  let filtered = allRecipes;

  if (currentFilter !== "all") {
    filtered = filtered.filter(r => r.category === currentFilter);
  }
  if (query) {
    filtered = filtered.filter(r =>
      cyrillicToLatin(r.title.toLowerCase()).includes(query) ||
      (r.tags || []).some(t => cyrillicToLatin(t.toLowerCase()).includes(query))
    );
  }
  renderRecipes(filtered);
}

// Kategoriya filtr tugmalari
filterRow.querySelectorAll(".filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    filterRow.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.getAttribute("data-cat");
    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);

// URL'dan kategoriya kelgan bo'lsa (masalan bosh sahifadan), avtomatik tanlash
const urlParams = new URLSearchParams(window.location.search);
const catFromUrl = urlParams.get("cat");
if (catFromUrl) {
  currentFilter = catFromUrl;
  const targetChip = filterRow.querySelector(`[data-cat="${catFromUrl}"]`);
  if (targetChip) {
    filterRow.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    targetChip.classList.add("active");
  }
}

// URL'dan qidiruv so'zi kelgan bo'lsa (bosh sahifadan), qutiga avtomatik joylash
const qFromUrl = urlParams.get("q");
if (qFromUrl) {
  searchInput.value = qFromUrl;
}

// Firestore'dan retseptlarni yuklash (kesh orqali — tezroq)
loadRecipesWithCache((recipes) => {
  allRecipes = recipes;
  applyFilters();
});

