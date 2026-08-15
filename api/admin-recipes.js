// ===== Taomchi — Admin API (retseptlar) =====
// GET    /api/admin-recipes        -> barcha retseptlar ro'yxati
// POST   /api/admin-recipes        -> yangi retsept qo'shish
// PUT    /api/admin-recipes        -> mavjud retseptni tahrirlash (body.id kerak)
// DELETE /api/admin-recipes        -> retseptni o'chirish (body.id kerak)
//
// Hammasi "x-admin-secret" header orqali himoyalangan.
// Vercel'da Environment Variables'ga ADMIN_SECRET qo'shilishi shart.

const { getDb } = require("../lib/firebaseAdmin");

module.exports = async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  const db = getDb();

  try {
    if (req.method === "GET") {
      const snapshot = await db.collection("recipes").get();
      const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(recipes);
    }

    if (req.method === "POST") {
      const data = { ...req.body, createdAt: Date.now() };
      const ref = await db.collection("recipes").add(data);
      return res.status(200).json({ id: ref.id });
    }

    if (req.method === "PUT") {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ error: "id kerak" });
      await db.collection("recipes").doc(id).set(data, { merge: true });
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "id kerak" });
      await db.collection("recipes").doc(id).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
