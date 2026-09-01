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
  premiumActions.classList.remove("screen-hidden");
  premiumActions.innerHTML = `
    <p class="premium-actions-text">${tp("premium_buy_confirm_text", "👑 Premium bilan kuniga 15 marta AI'dan so'rashingiz mumkin. Muddatni tanlang:")}</p>
    <div class="premium-actions-row">
      <button class="premium-btn premium-btn--ghost" id="premiumCancelBtn">${tp("premium_cancel_btn", "Bekor qilish")}</button>
      <button class="premium-btn premium-btn--secondary" id="premiumMonthlyBtn">${tp("premium_monthly_btn", "Oylik")} ⭐${premiumState.monthlyStarsPrice}</button>
      <button class="premium-btn premium-btn--primary" id="premiumYearlyBtn">${tp("premium_yearly_btn", "Yillik")} ⭐${premiumState.yearlyStarsPrice}</button>
    </div>
  `;
  document.getElementById("premiumCancelBtn").addEventListener("click", closePremiumActions);
  document.getElementById("premiumMonthlyBtn").addEventListener("click", () => buyPremium("monthly"));
  document.getElementById("premiumYearlyBtn").addEventListener("click", () => buyPremium("yearly"));
}

async function buyPremium(plan) {
  const btnId = plan === "yearly" ? "premiumYearlyBtn" : "premiumMonthlyBtn";
  const btn = document.getElementById(btnId);
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
