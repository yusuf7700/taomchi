// ===== Taomchi — Admin API (retseptlar) =====
// GET    /api/admin-recipes        -> barcha retseptlar ro'yxati
// POST   /api/admin-recipes        -> yangi retsept qo'shish
// PUT    /api/admin-recipes        -> mavjud retseptni tahrirlash (body.id kerak)
// DELETE /api/admin-recipes        -> retseptni o'chirish (body.id kerak)
//
// Hammasi "x-admin-secret" header orqali himoyalangan.
// Vercel'da Environment Variables'ga ADMIN_SECRET qo'shilishi shart.

const { getDb } = require("../lib/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");
const { safeCompare } = require("../lib/safeCompare");
const { PRIVATE_FIELDS, splitRecipeFields } = require("../lib/recipeFields");
const { computeIngredientKeywordIds } = require("../lib/pantryKeywords");

module.exports = async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || !process.env.ADMIN_SECRET || !safeCompare(secret, process.env.ADMIN_SECRET)) {
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
    if (req.method === "POST" && req.body?.action === "migrate_legacy_content") {
      // BIR MARTALIK migratsiya: eski retseptlarda hali ham `recipes/{id}`
      // hujjatining o'zida saqlangan ingredient/steps/sourceUrl kabi maydonlarni
      // `recipeContent/{id}`ga ko'chiradi va asl hujjatdan olib tashlaydi.
      // Xavfsiz — allaqachon ko'chirilgan retseptlarni qayta ishlamaydi.
      const snapshot = await db.collection("recipes").get();
      let migrated = 0, skipped = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const hasLegacyFields = PRIVATE_FIELDS.some(f => f in data);
        if (!hasLegacyFields) { skipped++; continue; }

        const { publicFields, privateFields } = splitRecipeFields(data);
        publicFields.ingredientKeywordIds = computeIngredientKeywordIds(privateFields.ingredients);

        const deletions = {};
        PRIVATE_FIELDS.forEach(f => { deletions[f] = FieldValue.delete(); });

        await db.collection("recipes").doc(doc.id).set({ ...publicFields, ...deletions }, { merge: true });
        await db.collection("recipeContent").doc(doc.id).set(privateFields, { merge: true });
        migrated++;
      }

      return res.status(200).json({ success: true, migrated, skipped });
    }

    if (req.method === "GET") {
      const [recipesSnap, contentSnap] = await Promise.all([
        db.collection("recipes").get(),
        db.collection("recipeContent").get()
      ]);
      const contentMap = {};
      contentSnap.docs.forEach(doc => { contentMap[doc.id] = doc.data(); });

      const recipes = recipesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ...(contentMap[doc.id] || {})
      }));
      return res.status(200).json(recipes);
    }

    if (req.method === "POST") {
      const { publicFields, privateFields } = splitRecipeFields(req.body);
      publicFields.ingredientKeywordIds = computeIngredientKeywordIds(privateFields.ingredients);
      publicFields.createdAt = Date.now();

      const ref = await db.collection("recipes").add(publicFields);
      await db.collection("recipeContent").doc(ref.id).set(privateFields);
      return res.status(200).json({ id: ref.id });
    }

    if (req.method === "PUT") {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ error: "id kerak" });

      const { publicFields, privateFields } = splitRecipeFields(data);
      publicFields.ingredientKeywordIds = computeIngredientKeywordIds(privateFields.ingredients);

      await db.collection("recipes").doc(id).set(publicFields, { merge: true });
      await db.collection("recipeContent").doc(id).set(privateFields, { merge: true });
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "id kerak" });
      await Promise.all([
        db.collection("recipes").doc(id).delete(),
        db.collection("recipeContent").doc(id).delete()
      ]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
