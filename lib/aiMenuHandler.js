// ===== Ovqaty — AI haftalik menyu tuzish (faqat Premium) =====
// POST /api/weekly-menu  body: { action: "ai-generate", initData, dates: ["YYYY-MM-DD", ...1..7 ta], diet: boolean }
// (api/weekly-menu.js ichidan chaqiriladi — Vercel Hobby'da api/ ichida 12 tadan ko'p fayl bo'lishi mumkin emas)
//
// Natija to'g'ridan-to'g'ri weeklyMenus/{telegram_id} hujjatiga yoziladi
// (api/weekly-menu.js bilan bir xil tuzilma: days.{sana}.{lunch|dinner} = recipeId)
// va mijozga ham qaytariladi.
//
// Xatolar: 403 premium_required, 429 limit, 400 not_enough_diet / not_enough_recipes.

const { verifyTelegramInitData } = require("./verifyTelegramInitData");
const { ensureUserIdentity } = require("./ensureUserIdentity");
const {
  MENU_DAILY_LIMIT,
  reserveMenuQuota,
  refundMenuQuota,
  generateWeeklyMenu,
  getTashkentDateString
} = require("./aiMenu");

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_AWAY = 60;

function validateDates(dates) {
  if (!Array.isArray(dates) || dates.length < 1 || dates.length > 7) return null;
  if (new Set(dates).size !== dates.length) return null;

  const todayMs = Date.parse(getTashkentDateString() + "T00:00:00Z");
  for (const d of dates) {
    if (typeof d !== "string" || !DATE_KEY_RE.test(d)) return null;
    const ms = Date.parse(d + "T00:00:00Z");
    if (Number.isNaN(ms)) return null;
    if (Math.abs(ms - todayMs) > MAX_DAYS_AWAY * DAY_MS) return null;
  }
  return dates.slice().sort();
}

async function handleAiMenu(req, res, db) {
  const { initData, dates, diet } = req.body || {};

  const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

  const validDates = validateDates(dates);
  if (!validDates) return res.status(400).json({ error: "Noto'g'ri sanalar" });

  let reserved = false;
  try {
    await ensureUserIdentity(db, tgUser);

    const quota = await reserveMenuQuota(db, tgUser.id);
    if (!quota.allowed) {
      if (quota.reason === "not_premium") {
        return res.status(403).json({
          error: "premium_required",
          message: "AI menyu faqat Premium foydalanuvchilar uchun."
        });
      }
      return res.status(429).json({
        error: "limit",
        message: `Bugungi AI menyu limiti tugadi (kuniga ${MENU_DAILY_LIMIT} marta).`
      });
    }
    reserved = true;

    const days = await generateWeeklyMenu(db, { dates: validDates, dietOnly: diet === true });

    await db.collection("weeklyMenus").doc(String(tgUser.id)).set(
      { days, updatedAt: Date.now() },
      { merge: true }
    );

    return res.status(200).json({ days, remainingToday: quota.remainingToday });
  } catch (err) {
    if (reserved) await refundMenuQuota(db, tgUser.id);

    if (err && (err.code === "not_enough_diet" || err.code === "not_enough_recipes")) {
      return res.status(400).json({ error: err.code, message: err.message });
    }
    console.error("AI menyu xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko'ring." });
  }
}

module.exports = { handleAiMenu };
