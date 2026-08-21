// ===== Taomchi — Admin API (barcha foydalanuvchilarga xabar yuborish) =====
// POST /api/broadcast   body: { text: string, imageUrl?: string }
//
// "x-admin-secret" header orqali himoyalangan.

const { getDb } = require("../lib/firebaseAdmin");
const bot = require("../bot/bot");

module.exports = async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  }

  const { text, imageUrl } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Xabar matni kerak" });
  }

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT noto'g'ri: " + err.message });
  }

  try {
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
      } catch (err) {
        failed++; // bot bloklangan yoki chat topilmadi
      }
      // Telegram limitidan chiqib ketmaslik uchun har xabar orasida kichik pauza
      await new Promise(resolve => setTimeout(resolve, 40));
    }

    return res.status(200).json({ sent, failed, total: userIds.length });
  } catch (err) {
    console.error("Broadcast xatosi:", err);
    return res.status(500).json({ error: err.message });
  }
};
