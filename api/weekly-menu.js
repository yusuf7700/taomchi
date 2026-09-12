// ===== Taomchi — Haftalik ovqat rejasi =====
// GET  /api/weekly-menu?initData=...                                    -> barcha saqlangan kunlar (sana bo'yicha)
// POST /api/weekly-menu  body: { initData, date, meal, recipeId }       -> bitta ovqatni saqlash/tozalash
//   date: "YYYY-MM-DD"; meal: "lunch" | "dinner"; recipeId: null yuborilsa — o'sha ovqat tozalanadi
//
// Ma'lumot tuzilishi: days.{YYYY-MM-DD}.{meal} = recipeId
// (masalan days["2026-09-14"].lunch = "abc123")
//
// Eslatma: ilgari reja kun NOMIGA (mon/tue/...) bog'langan abadiy shablon
// edi. Endi haqiqiy sanaga bog'langan — shuning uchun har hafta boshqacha
// reja tuzish mumkin. Eski formatdagi hujjatlar birinchi GET so'rovida
// avtomatik joriy haftaga ko'chiriladi (bir martalik migratsiya).
//
// Reja Telegram akkauntga bog'liq (Firestore "weeklyMenus/{telegram_id}"),
// shuning uchun foydalanuvchi istalgan qurilmadan o'zining rejasini ko'radi.
// "x-admin-secret" emas — Telegram initData imzosi orqali himoyalangan
// (har kim faqat o'zining rejasini o'zgartira oladi).

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");
const { hasLegacyKeys, migrateLegacyDays } = require("../lib/weeklyMenuDates");

const VALID_MEALS = ["lunch", "dinner"];
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = async (req, res) => {
  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko'ring." });
  }

  try {
    if (req.method === "GET") {
      const initData = req.query.initData;
      const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      const ref = db.collection("weeklyMenus").doc(String(tgUser.id));
      const doc = await ref.get();
      let days = doc.exists ? (doc.data().days || {}) : {};

      // Eski (kun-nomli) format aniqlansa — joriy haftaga ko'chirib, saqlab qo'yamiz
      if (hasLegacyKeys(days)) {
        days = migrateLegacyDays(days);
        await ref.set({ days, updatedAt: Date.now() }, { merge: false });
      }

      return res.status(200).json({ days });
    }

    if (req.method === "POST") {
      const { initData, date, meal, recipeId } = req.body || {};
      const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      if (!DATE_KEY_RE.test(date || "")) {
        return res.status(400).json({ error: "Noto'g'ri sana: " + date });
      }
      if (!VALID_MEALS.includes(meal)) {
        return res.status(400).json({ error: "Noto'g'ri ovqat turi: " + meal });
      }

      const ref = db.collection("weeklyMenus").doc(String(tgUser.id));
      await ref.set(
        {
          days: { [date]: { [meal]: recipeId || null } },
          updatedAt: Date.now()
        },
        { merge: true }
      );
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko'ring." });
  }
};
