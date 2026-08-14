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

// --- Bildirishnoma toggle (hozircha faqat vizual, keyin FCM ulanadi) ---
const notifToggle = document.getElementById("notifToggle");
const NOTIF_KEY = "taomchi_notifications";
notifToggle.checked = localStorage.getItem(NOTIF_KEY) !== "off";
notifToggle.addEventListener("change", () => {
  localStorage.setItem(NOTIF_KEY, notifToggle.checked ? "on" : "off");
});
