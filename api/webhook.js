// ===== Taomchi — Telegram webhook =====
// Telegram bu manzilga har bir xabar/harakat haqida xabar yuboradi.

module.exports = async (req, res) => {
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
