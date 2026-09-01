// ===== Taomchi — Profil =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// --- Telegram foydalanuvchi ma'lumotlari ---
const tgUser = tg?.initDataUnsafe?.user;
const nameEl = document.getElementById("profileName");
const usernameEl = document.getElementById("profileUsername");
const avatarEl = document.getElementById("profileAvatar");

if (tgUser) {
  nameEl.textContent = tgUser.first_name || "Foydalanuvchi";
  usernameEl.textContent = tgUser.username ? "@" + tgUser.username : "";
  avatarEl.textContent = (tgUser.first_name || "F").charAt(0).toUpperCase();
}

// --- Til qatori ---
function updateLangValue() {
  const lang = getCurrentLang();
  const langValueEl = document.getElementById("langValue");
  if (langValueEl) langValueEl.textContent = lang === "uz" ? "Lotin" : "Кирилл";
}

document.getElementById("langRow").addEventListener("click", () => {
  toggleLang();
  updateLangValue();
  renderPremiumBanner();
});

document.addEventListener("DOMContentLoaded", updateLangValue);

// --- Bildirishnoma toggle (Telegram bot orqali eslatma yuboriladi) ---
const notifToggle = document.getElementById("notifToggle");

async function loadNotificationSetting() {
  if (!tg?.initData) return; // Telegram tashqarisida ochilgan bo'lishi mumkin (test rejimi)
  try {
    const res = await fetch(`/api/user-settings?initData=${encodeURIComponent(tg.initData)}`);
    if (!res.ok) return;
    const data = await res.json();
    notifToggle.checked = data.notificationsEnabled;
  } catch {
    // Internet yo'q bo'lishi mumkin — joriy (standart) holatda qoldiramiz
  }
}

notifToggle.addEventListener("change", async () => {
  if (!tg?.initData) return;
  try {
    await fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, notificationsEnabled: notifToggle.checked })
    });
  } catch {
    // Xato bo'lsa ham UI holati saqlanadi, keyingi safar qayta urinib ko'ramiz
  }
});

loadNotificationSetting();

// --- Premium holati (server-authoritative, Firestore orqali) ---
const premiumBanner = document.getElementById("premiumBanner");
const premiumTitle = document.getElementById("premiumTitle");
const premiumSubtitle = document.getElementById("premiumSubtitle");
const premiumActions = document.getElementById("premiumActions");

function tp(key, fallback) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return dict[key] || fallback || key;
}

let premiumState = { active: false, daysLeft: 0, trialAvailable: false, monthlyStarsPrice: 77, yearlyStarsPrice: 777, trialDays: 3 };

// Server javobi kelgunicha statik "Tez orada..." matni bir lahzaga
// ko'rinib qolmasligi uchun — darhol "Yuklanmoqda..." holatini qo'yamiz.
premiumTitle.textContent = tp("premium_title", "Taomchi Premium");
premiumSubtitle.textContent = tp("ai_loading", "Yuklanmoqda...");
premiumBanner.style.cursor = "default";
premiumBanner.onclick = null;

async function loadPremiumStatus() {
  if (!tg?.initData) { renderPremiumBanner(); return; }
  try {
    const res = await fetch(`/api/premium?initData=${encodeURIComponent(tg.initData)}`);
    if (!res.ok) throw new Error();
    premiumState = await res.json();
  } catch {
    // Internet yo'q bo'lishi mumkin — oldingi (yoki standart) holatda qoldiramiz
  }
  renderPremiumBanner();
}

function closePremiumActions() {
  premiumActions.classList.add("screen-hidden");
  premiumActions.innerHTML = "";
}

function renderPremiumBanner() {
  closePremiumActions();

  if (premiumState.active) {
    premiumTitle.textContent = tp("premium_active_title", "⭐ Premium faol");
    premiumSubtitle.textContent = premiumState.daysLeft + tp("premium_days_left_suffix", " kun qoldi");
    premiumBanner.onclick = null;
    premiumBanner.style.cursor = "default";
    return;
  }

  premiumBanner.style.cursor = "pointer";

  if (premiumState.trialAvailable) {
    premiumTitle.textContent = tp("premium_gift_title", "🎁 Sizga sovg'a bor!");
    premiumSubtitle.textContent = premiumState.trialDays + tp("premium_gift_subtitle_suffix", " kunlik Premium — bepul sinab ko'ring");
    premiumBanner.onclick = showTrialOffer;
  } else {
    premiumTitle.textContent = tp("premium_title", "Taomchi Premium");
    premiumSubtitle.textContent = tp("premium_buy_subtitle_prefix", "Oyiga ⭐") + premiumState.monthlyStarsPrice + tp("premium_buy_subtitle_suffix", " — kuniga 15 marta AI'dan so'rang");
    premiumBanner.onclick = showPurchaseOffer;
  }
}

function showTrialOffer() {
  premiumActions.classList.remove("screen-hidden");
  premiumActions.innerHTML = `
    <p class="premium-actions-text">🎁 ${premiumState.trialDays}${escapeHtmlP(tp("premium_trial_confirm_suffix", " kunlik Premium sovg'angizni faollashtirasizmi?"))}</p>
    <div class="premium-actions-row">
      <button class="premium-btn premium-btn--ghost" id="premiumCancelBtn">${tp("premium_cancel_btn", "Bekor qilish")}</button>
      <button class="premium-btn premium-btn--primary" id="premiumClaimBtn">${tp("premium_use_btn", "Ishlatish")}</button>
    </div>
  `;
  document.getElementById("premiumCancelBtn").addEventListener("click", closePremiumActions);
  document.getElementById("premiumClaimBtn").addEventListener("click", claimTrial);
}

function escapeHtmlP(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function claimTrial() {
  const btn = document.getElementById("premiumClaimBtn");
  btn.disabled = true;
  btn.textContent = tp("ai_loading", "Yuklanmoqda...");
  try {
    const res = await fetch("/api/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, action: "claim_trial" })
    });
    if (!res.ok) throw new Error();
    await loadPremiumStatus();
  } catch {
    btn.disabled = false;
    btn.textContent = tp("premium_use_btn", "Ishlatish");
    alert(tp("premium_error", "Xatolik yuz berdi, birozdan keyin qayta urinib ko'ring."));
  }
}

function showPurchaseOffer() {
  let selectedPlan = "yearly";
  premiumActions.classList.remove("screen-hidden");

  const yearlySavingsPct = Math.round((1 - premiumState.yearlyStarsPrice / (premiumState.monthlyStarsPrice * 12)) * 100);

  premiumActions.innerHTML = `
    <p class="premium-actions-heading">👑 ${tp("premium_title", "Taomchi Premium")}</p>
    <ul class="premium-feature-list">
      <li>${tp("premium_feature_ai", "Kuniga 15 marta AI'dan so'rash")}</li>
      <li>${tp("premium_feature_recipes", "Premium retseptlarga to'liq kirish")}</li>
      <li>${tp("premium_feature_future", "Kelajakdagi yangi imkoniyatlar birinchilardan")}</li>
    </ul>
    <div class="premium-plan-cards">
      <div class="premium-plan-card" data-plan="monthly" id="planCardMonthly">
        <p class="premium-plan-name">${tp("premium_monthly_btn", "Oylik")}</p>
        <p class="premium-plan-price">⭐${premiumState.monthlyStarsPrice}</p>
        <p class="premium-plan-per">/ ${tp("premium_per_month", "oy")}</p>
      </div>
      <div class="premium-plan-card premium-plan-card--selected" data-plan="yearly" id="planCardYearly">
        <span class="premium-plan-badge">${yearlySavingsPct}% ${tp("premium_save", "tejash")}</span>
        <p class="premium-plan-name">${tp("premium_yearly_btn", "Yillik")}</p>
        <p class="premium-plan-price">⭐${premiumState.yearlyStarsPrice}</p>
        <p class="premium-plan-per">/ ${tp("premium_per_year", "yil")}</p>
      </div>
    </div>
    <button class="premium-btn premium-btn--primary premium-buy-cta" id="premiumBuyCta">⭐${premiumState.yearlyStarsPrice} — ${tp("premium_buy_cta", "Sotib olish")}</button>
    <button class="premium-btn premium-btn--ghost premium-cancel-link" id="premiumCancelBtn">${tp("premium_cancel_btn", "Bekor qilish")}</button>
    <p class="stars-buy-hint">${escapeHtmlP(tp("stars_buy_prompt", "Stars yetarli emasmi? Tez va oson sotib oling 👇"))}</p>
    <button class="premium-btn premium-btn--stars" id="premiumStarsLinkBtn">${tp("stars_buy_btn", "⭐ Stars sotib olish")}</button>
  `;

  function selectPlan(plan) {
    selectedPlan = plan;
    document.getElementById("planCardMonthly").classList.toggle("premium-plan-card--selected", plan === "monthly");
    document.getElementById("planCardYearly").classList.toggle("premium-plan-card--selected", plan === "yearly");
    const price = plan === "yearly" ? premiumState.yearlyStarsPrice : premiumState.monthlyStarsPrice;
    document.getElementById("premiumBuyCta").textContent = `⭐${price} — ${tp("premium_buy_cta", "Sotib olish")}`;
  }

  document.getElementById("planCardMonthly").addEventListener("click", () => selectPlan("monthly"));
  document.getElementById("planCardYearly").addEventListener("click", () => selectPlan("yearly"));
  document.getElementById("premiumCancelBtn").addEventListener("click", closePremiumActions);
  document.getElementById("premiumBuyCta").addEventListener("click", () => buyPremium(selectedPlan));
  document.getElementById("premiumStarsLinkBtn").addEventListener("click", openStarsBot);
}

const STARS_BOT_URL = "https://t.me/milliystar_bot?start=ref_7603550866";

function openStarsBot() {
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(STARS_BOT_URL);
  } else {
    window.open(STARS_BOT_URL, "_blank");
  }
}

async function buyPremium(plan) {
  const btn = document.getElementById("premiumBuyCta");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = tp("ai_loading", "Yuklanmoqda...");

  try {
    const res = await fetch("/api/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, action: "create_invoice", plan })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Server xatosi");

    tg.openInvoice(data.link, (status) => {
      if (status === "paid") {
        loadPremiumStatus();
      } else {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  } catch {
    btn.disabled = false;
    btn.textContent = originalText;
    alert(tp("premium_error", "Xatolik yuz berdi, birozdan keyin qayta urinib ko'ring."));
  }
}

loadPremiumStatus();
