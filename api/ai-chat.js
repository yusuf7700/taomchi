// ===== Taomchi — AI yordamchi API (Mini App uchun) =====
// POST /api/ai-chat  body: { initData, question, lang, history, images }
//
// Telegram initData imzosi orqali himoyalangan. Kunlik limit (bepul
// foydalanuvchilar uchun 1 marta/kun, Premium uchun 15/kun) lib/aiAssistant.js
// orqali tekshiriladi. Agar "images" (base64 rasmlar ro'yxati, eng ko'pi
// 4 ta) berilgan bo'lsa — bu alohida, faqat Premium foydalanuvchilarga
// ochiq, kuniga cheklangan funksiya (matn limitiga tegmaydi).

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");
const { ensureUserIdentity } = require("../lib/ensureUserIdentity");
const {
  checkAndConsumeAiQuota,
  checkAndConsumeAiImageQuota,
  askFoodAssistant,
  PREMIUM_IMAGE_DAILY_LIMIT
} = require("../lib/aiAssistant");

const MAX_IMAGES_PER_MESSAGE = 4;
// Har bir base64 rasm uchun taxminiy maksimal hajm (Vercel'ning so'rov
// tanasi chegarasidan (~4.5MB) xavfsiz pastda turishi uchun; mijoz
// tomonda rasmlar avvaldan siqilib yuboriladi, bu faqat qo'shimcha himoya).
const MAX_IMAGE_DATA_URL_LENGTH = 900 * 1024;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  }

  const { initData, question, lang, history, images } = req.body || {};
  const imageList = Array.isArray(images) ? images.filter((i) => typeof i === "string" && i.length > 0) : [];
  const hasImages = imageList.length > 0;

  if ((!question || !question.trim()) && !hasImages) {
    return res.status(400).json({ error: "Savol yoki rasm bo'sh bo'lmasligi kerak" });
  }

  if (hasImages) {
    if (imageList.length > MAX_IMAGES_PER_MESSAGE) {
      return res.status(400).json({ error: `Bir vaqtda eng ko'pi ${MAX_IMAGES_PER_MESSAGE} ta rasm yuborish mumkin` });
    }
    for (const img of imageList) {
      if (!img.startsWith("data:image/")) {
        return res.status(400).json({ error: "Noto'g'ri rasm formati" });
      }
      if (img.length > MAX_IMAGE_DATA_URL_LENGTH) {
        return res.status(400).json({ error: "Rasm hajmi juda katta" });
      }
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

    if (hasImages) {
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

      const answer = await askFoodAssistant(question, lang, history, imageList);
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
