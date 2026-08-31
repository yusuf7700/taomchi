// ===== Taomchi — AI yordamchi API (Mini App uchun) =====
// POST /api/ai-chat  body: { initData, question }
//
// Telegram initData imzosi orqali himoyalangan. Kunlik limit (bepul
// foydalanuvchilar uchun 1 marta/kun, Premium uchun cheksiz)
// lib/aiAssistant.js orqali tekshiriladi.

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");
const { checkAndConsumeAiQuota, askFoodAssistant } = require("../lib/aiAssistant");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  }

  const { initData, question, lang } = req.body || {};
  if (!question || !question.trim()) {
    return res.status(400).json({ error: "Savol bo'sh bo'lmasligi kerak" });
  }

  const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "Server xatosi: " + err.message });
  }

  try {
    const quota = await checkAndConsumeAiQuota(db, tgUser.id);
    if (!quota.allowed) {
      return res.status(429).json({ error: "limit", message: "Bugungi bepul so'rov limiti tugadi. Premium bilan cheksiz foydalaning." });
    }

    const answer = await askFoodAssistant(question, lang);
    return res.status(200).json({ answer, isPremium: quota.isPremium, remainingToday: quota.remainingToday });
  } catch (err) {
    console.error("AI chat xatosi:", err);
    return res.status(500).json({ error: err.message });
  }
};
