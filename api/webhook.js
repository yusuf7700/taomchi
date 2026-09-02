// ===== Taomchi — Telegram webhook =====
// Telegram bu manzilga har bir xabar/harakat haqida xabar yuboradi.
// Xavfsizlik: faqat Telegram'ning o'zi yuboradigan maxfiy token bilan
// kelgan so'rovlar qabul qilinadi — aks holda istalgan kishi soxta
// "to'lov muvaffaqiyatli bo'ldi" xabari yuborib, bepul Premium olishi mumkin edi.

const { safeCompare } = require("../lib/safeCompare");

module.exports = async (req, res) => {
  const token = req.headers["x-telegram-bot-api-secret-token"];
  if (!process.env.WEBHOOK_SECRET || !safeCompare(token || "", process.env.WEBHOOK_SECRET)) {
    return res.status(401).end();
  }

  try {
    const bot = require("../bot/bot");
    await bot.handleUpdate(req.body);
  } catch (err) {
    console.error("Webhook xatosi:", err.message, err.stack);
  }
  // Telegram'ga har doim 200 qaytaramiz — aks holda qayta-qayta urinib,
  // xabarlar "g'alizlashib" ketishi mumkin.
  res.status(200).end();
};
