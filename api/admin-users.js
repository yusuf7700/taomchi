// ===== Taomchi — Admin API (foydalanuvchilar) =====
// GET /api/admin-users -> barcha bot foydalanuvchilari ro'yxati
//
// "x-admin-secret" header orqali himoyalangan.

const { getDb } = require("../lib/firebaseAdmin");
const { getActiveChannels, addChannel, removeChannel } = require("../lib/requiredChannels");

module.exports = async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT noto'g'ri: " + err.message });
  }

  try {
    if (req.method === "GET") {
      if (req.query.resource === "channels") {
        const channels = await getActiveChannels(db);
        return res.status(200).json(channels);
      }

      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(users);
    }

    if (req.method === "POST") {
      const { userId, action, days, resource, channelId, title, expiresInDays, docId } = req.body || {};

      if (resource === "channels") {
        if (action === "add") {
          if (!channelId) return res.status(400).json({ error: "channelId kerak" });
          const result = await addChannel(db, channelId, title, expiresInDays);
          return res.status(200).json({ success: true, ...result });
        }

        if (action === "remove") {
          if (!docId) return res.status(400).json({ error: "docId kerak" });
          await removeChannel(db, docId);
          return res.status(200).json({ success: true });
        }

        return res.status(400).json({ error: "Noma'lum action" });
      }

      if (!userId) return res.status(400).json({ error: "userId kerak" });

      const userRef = db.collection("users").doc(String(userId));

      if (action === "grant_premium") {
        const numDays = Number(days) > 0 ? Number(days) : 30;
        const until = Date.now() + numDays * 24 * 60 * 60 * 1000;
        await userRef.set({ premiumUntil: until }, { merge: true });
        return res.status(200).json({ success: true, until });
      }

      if (action === "revoke_premium") {
        await userRef.set({ premiumUntil: 0 }, { merge: true });
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: "Noma'lum action" });
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
