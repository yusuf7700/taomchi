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
    ? `https://instagram.com/${encodeURIComponent(handle)}`
    : `https://t.me/${encodeURIComponent(handle)}`;
}

// Faqat ishonchli manbalardan (Telegram, Instagram) kelgan video havolalarini
// iframe/embed ichiga qo'yamiz — aks holda admin sessiyasi buzilganda
// tajovuzkor ixtiyoriy tashqi sahifani (fishing) yoki xavfli manzilni
// ilova ichida ko'rsatishi mumkin edi.
function isSafeVideoUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && [
      "t.me", "telegram.me", "instagram.com", "www.instagram.com"
    ].includes(u.hostname);
  } catch {
    return false;
  }
}

function buildVideoEmbedHtml(r) {
  if (!r.sourceUrl || !isSafeVideoUrl(r.sourceUrl)) return "";
  if (r.videoPlatform === "instagram") {
    return `<blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(r.sourceUrl)}" data-instgrm-version="14"></blockquote>`;
  }
  // Telegram: rasmiy iframe embed (?embed=1) — skript kerak emas, ishonchli ishlaydi
  return `<div class="video-embed-wrap"><iframe src="${escapeHtml(r.sourceUrl)}?embed=1" width="100%" height="420" frameborder="0" scrolling="no" allowfullscreen></iframe></div>`;
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
  if (!r.sourceUrl || !isSafeVideoUrl(r.sourceUrl)) return;
  if (r.videoPlatform === "instagram") {
    await loadScriptOnce("https://www.instagram.com/embed.js", "ig-embed-script");
    if (window.instgrm) window.instgrm.Embeds.process();
  }
  // Telegram iframe hech qanday qo'shimcha skriptsiz ishlaydi
}

// Joriy foydalanuvchi Premium faolmi — server orqali tekshiriladi
// (client tomonidagi Firestore o'qishni "aylanib o'tish" mumkin bo'lsa ham,
// bu MVP bosqichida yetarli: oddiy foydalanuvchi uchun to'liq matn
// ko'rsatilmaydi, texnik bilimga ega odam DevTools orqali aylanib o'tishi
// mumkin — lekin bu hozircha qabul qilinadigan xavf).
async function getUnlockStatus(recipeId) {
  if (!tg?.initData) return { premium: false, points: 0, redeemCost: 3, alreadyUnlocked: false };
  try {
    const [premiumRes, referralRes] = await Promise.all([
      fetch(`/api/premium?initData=${encodeURIComponent(tg.initData)}`),
      fetch(`/api/referral?initData=${encodeURIComponent(tg.initData)}`)
    ]);
    const premiumData = premiumRes.ok ? await premiumRes.json() : { active: false };
    const referralData = referralRes.ok ? await referralRes.json() : { points: 0, unlockedRecipes: [], redeemCost: 3 };
    return {
      premium: premiumData.active === true,
      points: referralData.points || 0,
      redeemCost: referralData.redeemCost || 3,
      alreadyUnlocked: (referralData.unlockedRecipes || []).includes(String(recipeId))
    };
  } catch {
    return { premium: false, points: 0, redeemCost: 3, alreadyUnlocked: false };
  }
}

async function redeemRecipeWithPoints(r) {
  const btn = document.getElementById("premiumRedeemBtn");
  btn.disabled = true;
  btn.textContent = getCurrentLang() === "uzk" ? "Юкланмоқда..." : "Yuklanmoqda...";

  try {
    const res = await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, action: "redeem_recipe", recipeId: r.id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Server xatosi");
    await renderRecipe(r); // qayta chizamiz — endi ochiq bo'ladi
  } catch {
    alert(getCurrentLang() === "uzk" ? "Хатолик юз берди." : "Xatolik yuz berdi.");
    btn.disabled = false;
  }
}

async function fetchRecipeContent(recipeId) {
  if (!tg?.initData) return { content: null, error: "no_telegram" };
  try {
    const res = await fetch(`/api/premium?initData=${encodeURIComponent(tg.initData)}&recipeId=${encodeURIComponent(recipeId)}`);
    if (!res.ok) return { content: null, error: "fetch_failed" };
    return { content: await res.json(), error: null };
  } catch {
    return { content: null, error: "fetch_failed" };
  }
}

async function renderRecipe(r) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;

  const unlockStatus = r.isPremium === true ? await getUnlockStatus(r.id) : null;
  const locked = r.isPremium === true && !(unlockStatus.premium || unlockStatus.alreadyUnlocked);
  const canRedeemWithPoints = locked && unlockStatus.points >= unlockStatus.redeemCost;

  // Retseptning to'liq tarkibi (ingredientlar, tayyorlash tartibi, video)
  // endi faqat SERVERDAN, ochilgan bo'lsagina olinadi — Firestore orqali
  // to'g'ridan-to'g'ri o'qib, paywall'ni chetlab o'tish endi mumkin emas.
  let content = {};
  let contentError = null;
  if (!locked) {
    const result = await fetchRecipeContent(r.id);
    content = result.content || {};
    contentError = result.error;
  }
  const full = { ...r, ...content };

  const ingredientsHtml = (content.ingredients || []).map(ing => `
    <li><span>${escapeHtml(displayText(ing.name))}</span><span class="ing-amount">${escapeHtml(ing.amount)}</span></li>
  `).join("");

  const stepsHtml = (content.steps || []).map((step, i) => `
    <li><span class="step-num">${i + 1}</span><span>${escapeHtml(displayText(step))}</span></li>
  `).join("");

  const bodyHtml = locked
    ? `
      <div class="premium-lock-card">
        <div class="premium-lock-icon">🔒</div>
        <p class="premium-lock-title" data-i18n="recipe_lock_title">Bu — Premium retsept</p>
        <p class="premium-lock-text" data-i18n="recipe_lock_text">To'liq tarkib, tayyorlash tartibi va videoni ko'rish uchun Premium'ga obuna bo'ling.</p>
        <button class="premium-lock-btn" id="premiumLockBtn" data-i18n="recipe_lock_btn">👑 Premium olish</button>
        ${canRedeemWithPoints
          ? `<button class="premium-lock-btn premium-lock-btn--points" id="premiumRedeemBtn">${dict.recipe_redeem_btn_prefix || "🎁 "}${unlockStatus.redeemCost}${dict.recipe_redeem_btn_suffix || " ball evaziga ochish"}</button>`
          : `<p class="premium-lock-points-hint">${dict.recipe_redeem_hint_prefix || "Ballaringiz: "}${unlockStatus.points}/${unlockStatus.redeemCost}${dict.recipe_redeem_hint_suffix || " — do'st taklif qilib ball to'plang!"}</p>`}
      </div>
    `
    : contentError
    ? `<p class="empty-text">Tarkibni yuklashda xatolik yuz berdi. Sahifani qayta oching.</p>`
    : `
      <h2 class="detail-section-title" data-i18n="ingredients_title">Kerakli mahsulotlar</h2>
      <ul class="ingredient-list">${ingredientsHtml}</ul>

      <h2 class="detail-section-title" data-i18n="steps_title">Tayyorlash tartibi</h2>
      <ol class="step-list">${stepsHtml}</ol>

      ${full.sourceUrl ? `
      <h2 class="detail-section-title">🎬 Tayyorlanish videosi</h2>
      <div class="detail-video">${buildVideoEmbedHtml(full)}</div>
      ` : ""}
    `;

  detailContent.innerHTML = `
    <div class="detail-hero">
      ${r.imageUrl ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}" class="detail-image">` : `<div class="detail-image detail-image--placeholder">🍽️</div>`}
    </div>
    <h1 class="detail-title">${escapeHtml(displayTitle(r))}</h1>
    <p class="detail-meta">
      <span>⏱ ${formatCookTime(r)}</span>
      ${difficultyBadge(r)}
      ${r.isPremium ? `<span class="premium-lock-mini-badge">⭐ Premium</span>` : ""}
    </p>

    ${bodyHtml}

    ${!locked && getChannelLink(full) ? `
    <a href="${escapeHtml(getChannelLink(full))}" target="_blank" rel="noopener noreferrer" class="source-card">
      <span class="source-card-icon">${full.videoPlatform === "instagram" ? "📷" : "📡"}</span>
      <span class="source-card-info">
        <span class="source-card-label">Manba kanali</span>
        <span class="source-card-name">${escapeHtml(full.author)}</span>
      </span>
      <span class="source-card-arrow">↗</span>
    </a>` : ""}
  `;

  applyTranslations(lang);
  if (locked) {
    document.getElementById("premiumLockBtn").addEventListener("click", () => {
      window.location.href = "profile.html";
    });
    document.getElementById("premiumRedeemBtn")?.addEventListener("click", () => redeemRecipeWithPoints(r));
  } else {
    processVideoEmbed(full);
  }
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
