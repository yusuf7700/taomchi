// ===== Taomchi — Telegram webhook =====
// Telegram bu manzilga har bir xabar/harakat haqida xabar yuboradi.

const bot = require("../bot/bot");

module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
  } catch (err) {
    console.error("Webhook xatosi:", err);
  }
  // Telegram'ga har doim 200 qaytaramiz — aks holda qayta-qayta urinib,
  // xabarlar "g'alizlashib" ketishi mumkin.
  res.status(200).end();
};
