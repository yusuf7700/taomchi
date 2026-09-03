// ===== Taomchi — Foydalanuvchi sozlamalari =====
// GET  /api/user-settings?initData=...                        -> joriy sozlamalar
// POST /api/user-settings  body: { initData, notificationsEnabled } -> saqlash
//
// Bu API "x-admin-secret" bilan emas, Telegram initData imzosi orqali
// himoyalangan — chunki har bir foydalanuvchi faqat o'zining sozlamasini
// o'zgartirishi kerak (admin panelidagi kabi bitta umumiy parol emas).

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");

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

      const doc = await db.collection("users").doc(String(tgUser.id)).get();
      const notificationsEnabled = doc.exists ? doc.data().notificationsEnabled !== false : true;
      return res.status(200).json({ notificationsEnabled });
    }

    if (req.method === "POST") {
      const { initData, notificationsEnabled } = req.body || {};
      const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      await db.collection("users").doc(String(tgUser.id)).set(
        { notificationsEnabled: !!notificationsEnabled },
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
