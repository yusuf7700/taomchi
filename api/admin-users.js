// ===== Taomchi — Admin API (foydalanuvchilar) =====
// GET /api/admin-users -> barcha bot foydalanuvchilari ro'yxati
//
// "x-admin-secret" header orqali himoyalangan.

const { getDb } = require("../lib/firebaseAdmin");

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
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(users);
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
