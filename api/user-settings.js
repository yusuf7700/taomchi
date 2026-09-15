// ===== Taomchi — Foydalanuvchi sozlamalari =====
// GET  /api/user-settings?initData=...                                        -> joriy sozlamalar
// POST /api/user-settings  body: { initData, dailyReminderEnabled?, weeklyReminderEnabled? } -> saqlash
//
// Bu API "x-admin-secret" bilan emas, Telegram initData imzosi orqali
// himoyalangan — chunki har bir foydalanuvchi faqat o'zining sozlamasini
// o'zgartirishi kerak (admin panelidagi kabi bitta umumiy parol emas).
//
// Eslatma: eski bitta "notificationsEnabled" maydoni ikkiga bo'lindi
// (kunlik ovqat / haftalik reja). Eski qiymatga ega, lekin yangi
// maydonlar hali yozilmagan hujjatlar uchun eskisi ikkalasiga ham
// standart sifatida qo'llaniladi (orqaga moslik).

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");
const { ensureUserIdentity } = require("../lib/ensureUserIdentity");

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
      await ensureUserIdentity(db, tgUser);

      const doc = await db.collection("users").doc(String(tgUser.id)).get();
      const data = doc.exists ? doc.data() : {};
      const legacyDefault = data.notificationsEnabled !== false; // eski maydon, hali ham fallback sifatida
      const dailyReminderEnabled = data.dailyReminderEnabled !== undefined ? data.dailyReminderEnabled : legacyDefault;
      const weeklyReminderEnabled = data.weeklyReminderEnabled !== undefined ? data.weeklyReminderEnabled : legacyDefault;
      return res.status(200).json({ dailyReminderEnabled, weeklyReminderEnabled });
    }

    if (req.method === "POST") {
      const { initData, dailyReminderEnabled, weeklyReminderEnabled } = req.body || {};
      const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });
      await ensureUserIdentity(db, tgUser);

      const update = {};
      if (dailyReminderEnabled !== undefined) update.dailyReminderEnabled = !!dailyReminderEnabled;
      if (weeklyReminderEnabled !== undefined) update.weeklyReminderEnabled = !!weeklyReminderEnabled;

      await db.collection("users").doc(String(tgUser.id)).set(update, { merge: true });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko'ring." });
  }
};
