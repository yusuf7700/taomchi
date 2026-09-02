// ===== Taomchi — Bitta retsept haqida xabar yuborish =====
// POST /api/notify-recipe   body: { recipeId }
//
// Faqat "notificationsEnabled" true (yoki hali sozlanmagan, standart holat)
// bo'lgan foydalanuvchilarga Telegram orqali yuboriladi — "📢 Xabar"
// (broadcast) dan farqli o'laroq, bu bitta muayyan retsept uchun.
//
// "x-admin-secret" header orqali himoyalangan.

const { getDb } = require("../lib/firebaseAdmin");
const { safeCompare } = require("../lib/safeCompare");
const bot = require("../bot/bot");

const TEXT = {
  uz: {
    title: (name) => `🍲 Yangi retsept qo'shildi: ${name}`,
    viewBtn: "📖 Ko'rish"
  },
  uzk: {
    title: (name) => `🍲 Янги рецепт қўшилди: ${name}`,
    viewBtn: "📖 Кўриш"
  }
};

module.exports = async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || !process.env.ADMIN_SECRET || !safeCompare(secret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  }

  const { recipeId } = req.body || {};
  if (!recipeId) return res.status(400).json({ error: "recipeId kerak" });

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT noto'g'ri: " + err.message });
  }

  try {
    const recipeDoc = await db.collection("recipes").doc(recipeId).get();
    if (!recipeDoc.exists) return res.status(404).json({ error: "Retsept topilmadi" });
    const recipe = recipeDoc.data();

    const usersSnap = await db.collection("users").get();
    const targets = usersSnap.docs.filter(doc => doc.data().notificationsEnabled !== false);

    let sent = 0;
    let failed = 0;

    for (const userDoc of targets) {
      const lang = userDoc.data().language === "uzk" ? "uzk" : "uz";
      const t = TEXT[lang];
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
      } catch (err) {
        failed++; // bot bloklangan yoki chat topilmadi
      }
      await new Promise(resolve => setTimeout(resolve, 40)); // Telegram limitidan chiqib ketmaslik uchun
    }

    return res.status(200).json({ sent, failed, total: targets.length });
  } catch (err) {
    console.error("Retsept xabari xatosi:", err);
    return res.status(500).json({ error: err.message });
  }
};
