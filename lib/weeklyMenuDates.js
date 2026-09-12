// ===== Taomchi — Haftalik reja: sana yordamchilari =====
// Eski tuzilma: days.{mon|tue|...}.{lunch|dinner} = recipeId (abadiy shablon)
// Yangi tuzilma: days.{YYYY-MM-DD}.{lunch|dinner} = recipeId (haqiqiy sana)
//
// Bu fayl ikkalasi orasida ko'prik bo'ladi: eski formatdagi hujjatlarni
// birinchi marta o'qilganda joriy haftaga ko'chiradi (migratsiya).

const LEGACY_DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const LEGACY_DAY_SET = new Set(LEGACY_DAY_ORDER);
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

function tashkentNow() {
  return new Date(Date.now() + TASHKENT_OFFSET_MS);
}

function dateKeyOf(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Joriy (Tashkent vaqti bo'yicha) haftaning Dushanba sanasini qaytaradi
function getCurrentMonday() {
  const now = tashkentNow();
  const dow = now.getUTCDay(); // 0=Yak..6=Shan
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() + diffToMonday);
  return monday;
}

// Bugungi kunning "YYYY-MM-DD" kalitini qaytaradi
function getTodayDateKey() {
  return dateKeyOf(tashkentNow());
}

// Eski kun-nomli kalitni ("mon") joriy haftadagi mos sanaga aylantiradi
function legacyDayToCurrentDateKey(day) {
  const idx = LEGACY_DAY_ORDER.indexOf(day);
  if (idx === -1) return null;
  const monday = getCurrentMonday();
  const d = new Date(monday);
  d.setUTCDate(monday.getUTCDate() + idx);
  return dateKeyOf(d);
}

// `days` obyektida eski (kun-nomli) kalitlar bormi tekshiradi
function hasLegacyKeys(days) {
  return Object.keys(days || {}).some(k => LEGACY_DAY_SET.has(k));
}

// Eski formatdagi `days`ni joriy haftaga bog'langan yangi (sana-nomli)
// formatga o'tkazadi. Sana-nomli kalitlar (agar allaqachon aralash holda
// bo'lsa) o'zgarishsiz saqlanadi.
function migrateLegacyDays(days) {
  const result = {};
  for (const [key, value] of Object.entries(days || {})) {
    if (LEGACY_DAY_SET.has(key)) {
      const dateKey = legacyDayToCurrentDateKey(key);
      if (dateKey) result[dateKey] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

module.exports = {
  getCurrentMonday,
  getTodayDateKey,
  legacyDayToCurrentDateKey,
  hasLegacyKeys,
  migrateLegacyDays,
  LEGACY_DAY_ORDER
};
