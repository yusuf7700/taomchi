// ===== Taomchi — Kunlik ovqat eslatmasi (Vercel Cron orqali avtomatik) =====
// Har kuni belgilangan vaqtda (vercel.json'dagi jadval bo'yicha) ishga
// tushadi — bittasi tushlik uchun ertalab, bittasi kechki ovqat uchun
// tushdan keyin (?meal=lunch yoki ?meal=dinner query orqali farqlanadi).
// Har bir foydalanuvchining "weeklyMenus/{id}" hujjatidan bugungi kunga
// belgilangan retseptni tekshiradi va — agar bor bo'lsa hamda
// bildirishnoma yoqilgan bo'lsa — Telegram orqali eslatma yuboradi.
//
// Xavfsizlik: faqat Vercel Cron'ning o'zi chaqira oladi (CRON_SECRET
// muhit o'zgaruvchisi orqali tasdiqlanadi, boshqa hech kim emas).

const { getDb } = require("../lib/firebaseAdmin");
const { safeCompare } = require("../lib/safeCompare");
const bot = require("../bot/bot");

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // getUTCDay() tartibida

const TEXT = {
  uz: {
    lunch: (name) => `🍽 Bugungi tushlik: ${name}\nYoqimli ishtaha!`,
    dinner: (name) => `🌙 Bugungi kechki ovqat: ${name}\nYoqimli ishtaha!`,
    viewBtn: "📖 Retseptni ko'rish"
  },
  uzk: {
    lunch: (name) => `🍽 Бугунги тушлик: ${name}\nЁқимли иштаҳа!`,
    dinner: (name) => `🌙 Бугунги кечки овқат: ${name}\nЁқимли иштаҳа!`,
    viewBtn: "📖 Рецептни кўриш"
  }
};

// O'zbekiston vaqti bo'yicha bugungi kun kalitini hisoblaydi (UTC+5,
// yozgi vaqtga o'tish yo'q, shuning uchun doimiy siljish yetarli).
function getTashkentDayKey() {
  const shifted = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return DAY_KEYS[shifted.getUTCDay()];
}

module.exports = async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!process.env.CRON_SECRET || !safeCompare(authHeader || "", `Bearer ${process.env.CRON_SECRET}`)) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  const meal = req.query.meal === "dinner" ? "dinner" : "lunch";

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT noto'g'ri: " + err.message });
  }

  try {
    const todayKey = getTashkentDayKey();

    const [menusSnap, usersSnap] = await Promise.all([
      db.collection("weeklyMenus").get(),
      db.collection("users").get()
    ]);

    const usersById = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const menuDoc of menusSnap.docs) {
      const userId = menuDoc.id;
      const recipeId = ((menuDoc.data().days || {})[todayKey] || {})[meal];
      if (!recipeId) { skipped++; continue; }

      const user = usersById.get(userId);
      if (!user || user.notificationsEnabled === false) { skipped++; continue; }

      const recipeDoc = await db.collection("recipes").doc(recipeId).get();
      if (!recipeDoc.exists) { skipped++; continue; }
      const recipe = recipeDoc.data();

      const lang = user.language === "uzk" ? "uzk" : "uz";
      const tt = TEXT[lang];
      const url = `${process.env.MINI_APP_URL}/recipe-detail.html?id=${recipeId}`;

      try {
        if (recipe.imageUrl) {
          await bot.telegram.sendPhoto(userId, recipe.imageUrl, {
            caption: tt[meal](recipe.title || ""),
            reply_markup: { inline_keyboard: [[{ text: tt.viewBtn, web_app: { url } }]] }
          });
        } else {
          await bot.telegram.sendMessage(userId, tt[meal](recipe.title || ""), {
            reply_markup: { inline_keyboard: [[{ text: tt.viewBtn, web_app: { url } }]] }
          });
        }
        sent++;
      } catch {
        failed++; // bot bloklangan yoki chat topilmadi
      }
      await new Promise(resolve => setTimeout(resolve, 40)); // Telegram limitidan chiqmaslik uchun
    }

    return res.status(200).json({ meal, day: todayKey, sent, skipped, failed });
  } catch (err) {
    console.error("Kunlik eslatma xatosi:", err);
    return res.status(500).json({ error: err.message });
  }
};
