// ===== Taomchi — Admin API ("Uyda nima bor?" mahsulotlari) =====
// GET  /api/admin-pantry?type=ingredients   -> tasdiqlangan mahsulotlar ro'yxati
//                                               (agar Firestore bo'sh bo'lsa, birinchi
//                                               marta boshlang'ich ro'yxat bilan avtomatik to'ldiradi)
// GET  /api/admin-pantry?type=suggestions   -> "kutilmoqda" holatidagi takliflar
// POST /api/admin-pantry  body:
//   { action: "approve", suggestionId, ingredient: { id, label, emoji, groupId, groupLabel, keywords } }
//   { action: "reject",  suggestionId }
//
// Hammasi "x-admin-secret" header orqali himoyalangan.

const { getDb } = require("../lib/firebaseAdmin");
const { buildCanonicalWordSet, isWordCovered } = require("../lib/pantryMatch");
const { ensureSeeded } = require("../lib/pantrySeed");

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
      const type = req.query.type || "ingredients";

      if (type === "ingredients") {
        await ensureSeeded(db);
        const snapshot = await db.collection("pantryIngredients").get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(items);
      }

      if (type === "suggestions") {
        const [suggestionsSnap, ingredientsSnap] = await Promise.all([
          db.collection("pantrySuggestions").where("status", "==", "pending").get(),
          db.collection("pantryIngredients").get()
        ]);

        const canonicalItems = ingredientsSnap.docs.map(doc => doc.data());
        const canonicalWordSet = buildCanonicalWordSet(canonicalItems);

        const stillPending = [];
        const alreadyCoveredIds = [];

        suggestionsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (isWordCovered(data.word, canonicalWordSet)) {
            alreadyCoveredIds.push(doc.id);
          } else {
            stillPending.push({ id: doc.id, ...data });
          }
        });

        // Eskirib qolgan (allaqachon mahsulotlar ro'yxatida bor) takliflarni
        // avtomatik tozalaymiz — admin ularni ikkinchi marta ko'rmasin
        if (alreadyCoveredIds.length > 0) {
          const batch = db.batch();
          alreadyCoveredIds.forEach(id => {
            batch.set(db.collection("pantrySuggestions").doc(id),
              { status: "auto_resolved", resolvedAt: Date.now() },
              { merge: true }
            );
          });
          await batch.commit();
        }

        const items = stillPending.sort((a, b) => (b.occurrences || 0) - (a.occurrences || 0));
        return res.status(200).json(items);
      }

      return res.status(400).json({ error: "Noto'g'ri type parametri" });
    }

    if (req.method === "POST") {
      const { action, suggestionId, ingredient } = req.body;

      if (action === "approve") {
        if (!suggestionId || !ingredient || !ingredient.id) {
          return res.status(400).json({ error: "suggestionId va ingredient.id kerak" });
        }
        const { id, ...data } = ingredient;
        await db.collection("pantryIngredients").doc(id).set(data, { merge: true });
        await db.collection("pantrySuggestions").doc(suggestionId).set(
          { status: "approved", approvedAs: id, resolvedAt: Date.now() },
          { merge: true }
        );
        return res.status(200).json({ success: true });
      }

      if (action === "reject") {
        if (!suggestionId) return res.status(400).json({ error: "suggestionId kerak" });
        await db.collection("pantrySuggestions").doc(suggestionId).set(
          { status: "rejected", resolvedAt: Date.now() },
          { merge: true }
        );
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
