// ===== Taomchi — AI uchun qo'shimcha so'rov invoice'i (Telegram Stars) =====
// POST /api/create-ai-invoice  body: { initData }
// Qaytaradi: { link } — Mini App shu havolani tg.openInvoice() orqali ochadi

const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");
const { EXTRA_QUESTION_STARS_PRICE } = require("../lib/aiAssistant");
const bot = require("../bot/bot");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  }

  const { initData } = req.body || {};
  const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

  try {
    const link = await bot.telegram.createInvoiceLink({
      title: "Qo'shimcha AI so'rovi",
      description: "1 marta qo'shimcha AI'dan savol so'rash huquqi",
      payload: `ai_bonus_${tgUser.id}`,
      provider_token: "", // Telegram Stars uchun bo'sh qoldiriladi
      currency: "XTR",
      prices: [{ label: "AI savol", amount: EXTRA_QUESTION_STARS_PRICE }]
    });
    return res.status(200).json({ link });
  } catch (err) {
    console.error("Invoice yaratish xatosi:", err);
    return res.status(500).json({ error: err.message });
  }
};
