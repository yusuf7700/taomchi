// ===== Taomchi — AI yordamchi API (Mini App uchun) =====
// POST /api/ai-chat  body: { initData, question, lang, history, image }
//
// Telegram initData imzosi orqali himoyalangan. Kunlik limit (bepul
// foydalanuvchilar uchun 1 marta/kun, Premium uchun 15/kun) lib/aiAssistant.js
// orqali tekshiriladi. Agar "image" (base64 rasm) berilgan bo'lsa — bu
// alohida, faqat Premium foydalanuvchilarga ochiq, kuniga cheklangan
// funksiya (matn limitiga tegmaydi).

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");
const { ensureUserIdentity } = require("../lib/ensureUserIdentity");
const {
  checkAndConsumeAiQuota,
  checkAndConsumeAiImageQuota,
  askFoodAssistant,
  PREMIUM_IMAGE_DAILY_LIMIT
} = require("../lib/aiAssistant");

// Base64 rasm uchun taxminiy maksimal hajm (Vercel'ning so'rov tanasi
// chegarasidan (~4.5MB) xavfsiz pastda turishi uchun; mijoz tomonda rasm
// avvaldan siqilib yuboriladi, bu faqat qo'shimcha himoya).
const MAX_IMAGE_DATA_URL_LENGTH = 4 * 1024 * 1024;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  }

  const { initData, question, lang, history, image } = req.body || {};
  const hasImage = typeof image === "string" && image.length > 0;

  if ((!question || !question.trim()) && !hasImage) {
    return res.status(400).json({ error: "Savol yoki rasm bo'sh bo'lmasligi kerak" });
  }

  if (hasImage) {
    if (!image.startsWith("data:image/")) {
      return res.status(400).json({ error: "Noto'g'ri rasm formati" });
    }
    if (image.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return res.status(400).json({ error: "Rasm hajmi juda katta" });
    }
  }

  const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko'ring." });
  }

  try {
    await ensureUserIdentity(db, tgUser);

    if (hasImage) {
      const quota = await checkAndConsumeAiImageQuota(db, tgUser.id);
      if (!quota.allowed) {
        if (quota.reason === "not_premium") {
          return res.status(403).json({
            error: "premium_required",
            message: "Rasm orqali savol berish faqat Premium foydalanuvchilar uchun."
          });
        }
        return res.status(429).json({
          error: "limit",
          message: `Bugungi rasm limiti tugadi (kuniga ${PREMIUM_IMAGE_DAILY_LIMIT} marta).`
        });
      }

      const answer = await askFoodAssistant(question, lang, history, image);
      return res.status(200).json({ answer, isPremium: quota.isPremium, imageRemainingToday: quota.remainingToday });
    }

    const quota = await checkAndConsumeAiQuota(db, tgUser.id);
    if (!quota.allowed) {
      return res.status(429).json({ error: "limit", message: "Bugungi bepul so'rov limiti tugadi. Premium bilan kuniga 15 marta so'rashingiz mumkin." });
    }

    const answer = await askFoodAssistant(question, lang, history);
    return res.status(200).json({ answer, isPremium: quota.isPremium, remainingToday: quota.remainingToday });
  } catch (err) {
    console.error("AI chat xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko'ring." });
  }
};
