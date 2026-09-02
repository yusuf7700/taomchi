// ===== Taomchi — Haftalik ovqat rejasi =====
// GET  /api/weekly-menu?initData=...                                    -> joriy hafta rejasi
// POST /api/weekly-menu  body: { initData, day, meal, recipeId }        -> bitta ovqatni saqlash/tozalash
//   meal: "lunch" | "dinner"; recipeId: null yuborilsa — o'sha ovqat tozalanadi
//
// Ma'lumot tuzilishi: days.{day}.{meal} = recipeId
// (masalan days.mon.lunch = "abc123")
//
// Reja Telegram akkauntga bog'liq (Firestore "weeklyMenus/{telegram_id}"),
// shuning uchun foydalanuvchi istalgan qurilmadan o'zining rejasini ko'radi.
// "x-admin-secret" emas — Telegram initData imzosi orqali himoyalangan
// (har kim faqat o'zining rejasini o'zgartira oladi).

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");

const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const VALID_MEALS = ["lunch", "dinner"];

module.exports = async (req, res) => {
  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko''ring." });
  }

  try {
    if (req.method === "GET") {
      const initData = req.query.initData;
      const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      const doc = await db.collection("weeklyMenus").doc(String(tgUser.id)).get();
      const days = doc.exists ? (doc.data().days || {}) : {};
      return res.status(200).json({ days });
    }

    if (req.method === "POST") {
      const { initData, day, meal, recipeId } = req.body || {};
      const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      if (!VALID_DAYS.includes(day)) {
        return res.status(400).json({ error: "Noto'g'ri kun: " + day });
      }
      if (!VALID_MEALS.includes(meal)) {
        return res.status(400).json({ error: "Noto'g'ri ovqat turi: " + meal });
      }

      const ref = db.collection("weeklyMenus").doc(String(tgUser.id));
      await ref.set(
        {
          days: { [day]: { [meal]: recipeId || null } },
          updatedAt: Date.now()
        },
        { merge: true }
      );
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko''ring." });
  }
};
