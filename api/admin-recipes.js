// ===== Taomchi — Admin API (retseptlar) =====
// GET    /api/admin-recipes        -> barcha retseptlar ro'yxati
// POST   /api/admin-recipes        -> yangi retsept qo'shish
// PUT    /api/admin-recipes        -> mavjud retseptni tahrirlash (body.id kerak)
// DELETE /api/admin-recipes        -> retseptni o'chirish (body.id kerak)
//
// Hammasi "x-admin-secret" header orqali himoyalangan.
// Vercel'da Environment Variables'ga ADMIN_SECRET qo'shilishi shart.

const { getDb } = require("../lib/firebaseAdmin");
const { extractUnmatchedWords, slugify } = require("../lib/pantryMatch");

// Retsept saqlangach (qo'shilganda yoki tahrirlanganda), ingredient matnlaridan
// hozircha tanilmagan so'zlarni topib, "pantrySuggestions" to'plamiga yozadi
// (admin panelda "🆕 Yangi mahsulotlar" bo'limida ko'rinadi va tasdiqlanishi kerak).
// Bu funksiya xato bersa ham retsept saqlanishiga xalaqit bermaydi (try/catch bilan o'raladi).
async function recordPantrySuggestions(db, recipeId, recipeTitle, ingredients) {
  const lines = (ingredients || []).map(i => i.name || "").filter(Boolean);
  if (lines.length === 0) return;

  const canonicalSnap = await db.collection("pantryIngredients").get();
  const canonicalItems = canonicalSnap.docs.map(doc => doc.data());

  const unmatched = extractUnmatchedWords(lines, canonicalItems);
  if (unmatched.size === 0) return;

  const batch = db.batch();
  for (const word of unmatched) {
    const id = slugify(word);
    if (!id) continue;
    const ref = db.collection("pantrySuggestions").doc(id);
    const existing = await ref.get();
    if (existing.exists && existing.data().status !== "pending") continue; // admin allaqachon hal qilgan

    if (existing.exists) {
      batch.set(ref, {
        occurrences: (existing.data().occurrences || 1) + 1,
        lastRecipeTitle: recipeTitle || ""
      }, { merge: true });
    } else {
      batch.set(ref, {
        word,
        sampleLine: lines.find(l => l.toLowerCase().includes(word)) || lines[0],
        recipeId: recipeId || "",
        recipeTitle: recipeTitle || "",
        occurrences: 1,
        status: "pending",
        createdAt: Date.now()
      });
    }
  }
  await batch.commit();
}

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
      const snapshot = await db.collection("recipes").get();
      const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(recipes);
    }

    if (req.method === "POST") {
      const data = { ...req.body, createdAt: Date.now() };
      const ref = await db.collection("recipes").add(data);
      try {
        await recordPantrySuggestions(db, ref.id, data.title, data.ingredients);
      } catch (err) {
        console.error("Pantry taklif yozishda xato (retsept baribir saqlandi):", err);
      }
      return res.status(200).json({ id: ref.id });
    }

    if (req.method === "PUT") {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ error: "id kerak" });
      await db.collection("recipes").doc(id).set(data, { merge: true });
      try {
        await recordPantrySuggestions(db, id, data.title, data.ingredients);
      } catch (err) {
        console.error("Pantry taklif yozishda xato (retsept baribir saqlandi):", err);
      }
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
