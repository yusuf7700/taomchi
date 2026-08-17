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

function getChannelLink(r) {
  if (!r.author) return null;
  const handle = r.author.replace(/^@/, "").trim();
  if (!handle) return null;
  return r.videoPlatform === "instagram"
    ? `https://instagram.com/${handle}`
    : `https://t.me/${handle}`;
}

function buildVideoEmbedHtml(r) {
  if (!r.sourceUrl) return "";
  if (r.videoPlatform === "instagram") {
    return `<blockquote class="instagram-media" data-instgrm-permalink="${r.sourceUrl}" data-instgrm-version="14"></blockquote>`;
  }
  // Telegram: rasmiy iframe embed (?embed=1) — skript kerak emas, ishonchli ishlaydi
  return `<div class="video-embed-wrap"><iframe src="${r.sourceUrl}?embed=1" width="100%" height="420" frameborder="0" scrolling="no" allowfullscreen></iframe></div>`;
}

function loadScriptOnce(src, id) {
  return new Promise((resolve) => {
    if (document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.id = id;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

async function processVideoEmbed(r) {
  if (!r.sourceUrl) return;
  if (r.videoPlatform === "instagram") {
    await loadScriptOnce("https://www.instagram.com/embed.js", "ig-embed-script");
    if (window.instgrm) window.instgrm.Embeds.process();
  }
  // Telegram iframe hech qanday qo'shimcha skriptsiz ishlaydi
}

const DIFFICULTY_LABELS = {
  oson: { emoji: "🟢", text: "Oson" },
  orta: { emoji: "🟡", text: "O'rta" },
  qiyin: { emoji: "🔴", text: "Qiyin" }
};

function difficultyBadge(r) {
  const d = DIFFICULTY_LABELS[r.difficulty];
  if (!d) return "";
  return `<span>${d.emoji} ${d.text}</span>`;
}

function renderRecipe(r) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;

  const ingredientsHtml = (r.ingredients || []).map(ing => `
    <li><span>${displayText(ing.name)}</span><span class="ing-amount">${ing.amount}</span></li>
  `).join("");

  const stepsHtml = (r.steps || []).map((step, i) => `
    <li><span class="step-num">${i + 1}</span><span>${displayText(step)}</span></li>
  `).join("");

  detailContent.innerHTML = `
    <div class="detail-hero">
      ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}" class="detail-image">` : `<div class="detail-image detail-image--placeholder">🍽️</div>`}
    </div>
    <h1 class="detail-title">${displayTitle(r)}</h1>
    <p class="detail-meta">
      <span>⏱ ${formatCookTime(r)}</span>
      <span>⭐ ${r.rating || "-"}</span>
      ${difficultyBadge(r)}
    </p>

    <h2 class="detail-section-title" data-i18n="ingredients_title">Kerakli mahsulotlar</h2>
    <ul class="ingredient-list">${ingredientsHtml}</ul>

    <h2 class="detail-section-title" data-i18n="steps_title">Tayyorlash tartibi</h2>
    <ol class="step-list">${stepsHtml}</ol>

    ${r.sourceUrl ? `
    <h2 class="detail-section-title">🎬 Tayyorlanish videosi</h2>
    <div class="detail-video">${buildVideoEmbedHtml(r)}</div>
    ` : ""}

    ${getChannelLink(r) ? `
    <a href="${getChannelLink(r)}" target="_blank" rel="noopener noreferrer" class="source-card">
      <span class="source-card-icon">${r.videoPlatform === "instagram" ? "📷" : "📡"}</span>
      <span class="source-card-info">
        <span class="source-card-label">Manba kanali</span>
        <span class="source-card-name">${r.author}</span>
      </span>
      <span class="source-card-arrow">↗</span>
    </a>` : ""}
  `;

  applyTranslations(lang);
  processVideoEmbed(r);
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
