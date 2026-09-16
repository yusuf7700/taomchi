// ===== Taomchi — Admin API (xabar yuborish) =====
// POST /api/broadcast   body: { text, imageUrl? }              -> barcha foydalanuvchilarga erkin xabar
// POST /api/broadcast   body: { recipeId }                     -> bitta retsept haqida xabar (avvalgi /api/notify-recipe)
//
// Ikkalasi ham bitta faylga birlashtirildi — Vercel Hobby rejasida
// bitta deploy'ga maksimal 12ta Serverless Function ruxsat etilgani
// uchun.
//
// "x-admin-secret" header orqali himoyalangan.

const { getDb } = require("../lib/firebaseAdmin");
const { safeCompare } = require("../lib/safeCompare");
const bot = require("../bot/bot");

const RECIPE_TEXT = {
  uz: {
    title: (name) => `🍲 Yangi retsept qo'shildi: ${name}`,
    viewBtn: "📖 Ko'rish"
  },
  uzk: {
    title: (name) => `🍲 Янги рецепт қўшилди: ${name}`,
    viewBtn: "📖 Кўриш"
  }
};

async function sendRecipeNotification(db, recipeId) {
  const recipeDoc = await db.collection("recipes").doc(recipeId).get();
  if (!recipeDoc.exists) return { error: "Retsept topilmadi", status: 404 };
  const recipe = recipeDoc.data();

  const usersSnap = await db.collection("users").get();
  const targets = usersSnap.docs.filter(doc => doc.data().notificationsEnabled !== false);

  let sent = 0;
  let failed = 0;

  for (const userDoc of targets) {
    const lang = userDoc.data().language === "uzk" ? "uzk" : "uz";
    const t = RECIPE_TEXT[lang];
    const url = `${process.env.MINI_APP_URL}/recipe-detail.html?id=${recipeId}`;

    try {
      if (recipe.imageUrl) {
        await bot.telegram.sendPhoto(userDoc.id, recipe.imageUrl, {
          caption: t.title(recipe.title || ""),
          reply_markup: { inline_keyboard: [[{ text: t.viewBtn, web_app: { url } }]] }
        });
      } else {
        await bot.telegram.sendMessage(userDoc.id, t.title(recipe.title || ""), {
          reply_markup: { inline_keyboard: [[{ text: t.viewBtn, web_app: { url } }]] }
        });
      }
      sent++;
    } catch {
      failed++; // bot bloklangan yoki chat topilmadi
    }
    await new Promise(resolve => setTimeout(resolve, 40)); // Telegram limitidan chiqib ketmaslik uchun
  }

  return { sent, failed, total: targets.length };
}

async function sendPlainBroadcast(db, text, imageUrl) {
  const usersSnap = await db.collection("users").get();
  const userIds = usersSnap.docs.map(doc => doc.id);

  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      if (imageUrl) {
        await bot.telegram.sendPhoto(userId, imageUrl, { caption: text });
      } else {
        await bot.telegram.sendMessage(userId, text);
      }
      sent++;
    } catch {
      failed++; // bot bloklangan yoki chat topilmadi
    }
    await new Promise(resolve => setTimeout(resolve, 40));
  }

  return { sent, failed, total: userIds.length };
}

module.exports = async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || !process.env.ADMIN_SECRET || !safeCompare(secret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  }

  const { text, imageUrl, recipeId } = req.body || {};

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT noto'g'ri: " + err.message });
  }

  try {
    if (recipeId) {
      const result = await sendRecipeNotification(db, recipeId);
      if (result.error) return res.status(result.status).json({ error: result.error });
      return res.status(200).json(result);
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Xabar matni yoki recipeId kerak" });
    }
    const result = await sendPlainBroadcast(db, text, imageUrl);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Broadcast xatosi:", err);
    return res.status(500).json({ error: err.message });
  }
};
