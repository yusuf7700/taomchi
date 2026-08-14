// ===== Taomchi — Retsept detali =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const detailContent = document.getElementById("detailContent");
const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.history.back();
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

if (!recipeId) {
  detailContent.innerHTML = `<p class="empty-text">Retsept topilmadi.</p>`;
} else {
  db.collection("recipes").doc(recipeId).get()
    .then(doc => {
      if (!doc.exists) {
        detailContent.innerHTML = `<p class="empty-text">Retsept topilmadi.</p>`;
        return;
      }
      renderRecipe(doc.data());
    })
    .catch(err => {
      console.error("Retseptni yuklashda xato:", err);
      detailContent.innerHTML = `<p class="empty-text">Xatolik yuz berdi.</p>`;
    });
}
