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

// --- Premium holati ---
function renderPremiumBanner() {
  const { active, daysLeft, trialUsed } = getPremiumStatus();
  const titleEl = document.getElementById("premiumTitle");
  const subtitleEl = document.getElementById("premiumSubtitle");
  const bannerEl = document.getElementById("premiumBanner");

  if (active) {
    titleEl.textContent = "⭐ Premium faol";
    subtitleEl.textContent = `Yana ${daysLeft} kun qoldi`;
    bannerEl.onclick = null;
  } else if (!trialUsed) {
    titleEl.textContent = "Taomchi Premium";
    subtitleEl.textContent = "7 kunlik bepul sinovni boshlash uchun bosing";
    bannerEl.onclick = () => {
      startPremiumTrial();
      renderPremiumBanner();
    };
  } else {
    titleEl.textContent = "Taomchi Premium";
    subtitleEl.textContent = "Tez orada — AI, shaxsiy menyu va boshqa imkoniyatlar";
    bannerEl.onclick = null;
  }
}

renderPremiumBanner();
