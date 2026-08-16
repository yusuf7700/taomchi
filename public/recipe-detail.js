// ===== Taomchi — Retsept detali =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const detailContent = document.getElementById("detailContent");
const backBtn = document.getElementById("backBtn");
const favBtn = document.getElementById("favBtn");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.history.back();
  });
}

let currentRecipeId = null;

function updateFavBtnState() {
  if (!favBtn || !currentRecipeId) return;
  favBtn.classList.toggle("active", isFavorite(currentRecipeId));
}

if (favBtn) {
  favBtn.addEventListener("click", () => {
    if (!currentRecipeId) return;
    toggleFavorite(currentRecipeId);
    updateFavBtnState();
  });
}

function renderRecipe(r) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;

  const ingredientsHtml = (r.ingredients || []).map(ing => `
    <li><span>${ing.name}</span><span class="ing-amount">${ing.amount}</span></li>
  `).join("");

  const stepsHtml = (r.steps || []).map((step, i) => `
    <li><span class="step-num">${i + 1}</span><span>${step}</span></li>
  `).join("");

  detailContent.innerHTML = `
    <div class="detail-hero">
      ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}" class="detail-image">` : `<div class="detail-image detail-image--placeholder">🍽️</div>`}
    </div>
    <h1 class="detail-title">${r.title}</h1>
    <p class="detail-meta">
      <span>⏱ ${r.cookTime || "-"} ${dict.minutes}</span>
      <span>⭐ ${r.rating || "-"}</span>
    </p>

    <h2 class="detail-section-title" data-i18n="ingredients_title">Kerakli mahsulotlar</h2>
    <ul class="ingredient-list">${ingredientsHtml}</ul>

    <h2 class="detail-section-title" data-i18n="steps_title">Tayyorlash tartibi</h2>
    <ol class="step-list">${stepsHtml}</ol>
  `;

  applyTranslations(lang);
}

const urlParams = new URLSearchParams(window.location.search);
const recipeId = urlParams.get("id");
currentRecipeId = recipeId;

if (!recipeId) {
  detailContent.innerHTML = `<p class="empty-text">Retsept topilmadi.</p>`;
} else {
  // Avval keshdan tekshiramiz — bor bo'lsa, Firestore'ga so'rov shart emas
  const cached = getCachedRecipes();
  const cachedRecipe = cached?.data.find(r => r.id === recipeId);

  if (cachedRecipe) {
    renderRecipe(cachedRecipe);
    updateFavBtnState();
  } else {
    db.collection("recipes").doc(recipeId).get()
      .then(doc => {
        if (!doc.exists) {
          detailContent.innerHTML = `<p class="empty-text">Retsept topilmadi.</p>`;
          return;
        }
        renderRecipe(doc.data());
        updateFavBtnState();
      })
      .catch(err => {
        console.error("Retseptni yuklashda xato:", err);
        detailContent.innerHTML = `<p class="empty-text">Xatolik yuz berdi.</p>`;
      });
  }
}
