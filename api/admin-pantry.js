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

// Boshlang'ich mahsulotlar ro'yxati — Firestore "pantryIngredients" to'plami
// bo'sh bo'lsa, shu ro'yxat bilan bir martalik avtomatik to'ldiriladi.
const SEED_INGREDIENTS = [
  { id: "tovuq", label: "Tovuq go'shti", emoji: "🍗", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["tovuq"] },
  { id: "mol_goshti", label: "Mol go'shti", emoji: "🥩", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["mol go'shti", "sigir go'shti"] },
  { id: "qoy_goshti", label: "Qo'y go'shti", emoji: "🍖", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["qo'y go'shti", "qo'y go'sht"] },
  { id: "baliq", label: "Baliq", emoji: "🐟", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["baliq"] },
  { id: "tuxum", label: "Tuxum", emoji: "🥚", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["tuxum"] },

  { id: "kartoshka", label: "Kartoshka", emoji: "🥔", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["kartoshka"] },
  { id: "sabzi", label: "Sabzi", emoji: "🥕", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["sabzi"] },
  { id: "piyoz", label: "Piyoz", emoji: "🧅", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["piyoz"] },
  { id: "kok_piyoz", label: "Ko'k piyoz", emoji: "🌱", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["ko'k piyoz"] },
  { id: "pomidor", label: "Pomidor", emoji: "🍅", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["pomidor"] },
  { id: "bodring", label: "Bodring", emoji: "🥒", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["bodring"] },
  { id: "qalampir", label: "Qalampir (bulg'or)", emoji: "🫑", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["qalampir", "bolgar qalampiri"] },
  { id: "baqlajon", label: "Baqlajon", emoji: "🍆", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["baqlajon"] },
  { id: "kabachka", label: "Kabachka", emoji: "🥒", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["kabachka"] },
  { id: "sarimsoq", label: "Sarimsoq piyoz", emoji: "🧄", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["sarimsoq"] },
  { id: "karam", label: "Karam", emoji: "🥬", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["karam"] },
  { id: "sholgom", label: "Sholg'om", emoji: "🥔", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["sholg'om"] },

  { id: "kashnich", label: "Kashnich", emoji: "🌿", groupId: "herbs", groupLabel: "Ko'katlar", keywords: ["kashnich"] },
  { id: "ukrop", label: "Ukrop", emoji: "🌿", groupId: "herbs", groupLabel: "Ko'katlar", keywords: ["ukrop"] },
  { id: "rayhon", label: "Rayhon", emoji: "🌿", groupId: "herbs", groupLabel: "Ko'katlar", keywords: ["rayhon"] },
  { id: "salat_barglari", label: "Salat barglari", emoji: "🥬", groupId: "herbs", groupLabel: "Ko'katlar", keywords: ["salat barg", "salat"] },

  { id: "guruch", label: "Guruch", emoji: "🍚", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["guruch"] },
  { id: "un", label: "Un", emoji: "🌾", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["un"] },
  { id: "makaron", label: "Makaron", emoji: "🍝", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["makaron"] },
  { id: "noxat", label: "No'xat", emoji: "🫘", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["no'xat"] },
  { id: "loviya", label: "Loviya", emoji: "🫘", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["loviya"] },
  { id: "mosh", label: "Mosh", emoji: "🫘", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["mosh"] },

  { id: "sut", label: "Sut", emoji: "🥛", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["sut"] },
  { id: "qatiq", label: "Qatiq", emoji: "🥛", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["qatiq"] },
  { id: "tvorog", label: "Tvorog", emoji: "🧀", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["tvorog", "tvarog", "tvarojniy"] },
  { id: "smetana", label: "Smetana", emoji: "🥄", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["smetana"] },
  { id: "sir", label: "Sir (pishloq)", emoji: "🧀", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["sir", "pishloq"] },
  { id: "sariyog", label: "Sariyog'", emoji: "🧈", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["sariyog'"] },

  { id: "limon", label: "Limon", emoji: "🍋", groupId: "fruit", groupLabel: "Mevalar", keywords: ["limon"] },
  { id: "olma", label: "Olma", emoji: "🍎", groupId: "fruit", groupLabel: "Mevalar", keywords: ["olma"] },
  { id: "uzum", label: "Uzum", emoji: "🍇", groupId: "fruit", groupLabel: "Mevalar", keywords: ["uzum"] },
  { id: "banan", label: "Banan", emoji: "🍌", groupId: "fruit", groupLabel: "Mevalar", keywords: ["banan"] },

  { id: "osimlik_yogi", label: "O'simlik yog'i", emoji: "🛢️", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["o'simlik yog'i", "kungaboqar yog'i"] },
  { id: "tomat_pasta", label: "Tomat pasta", emoji: "🥫", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["tomat past"] },
  { id: "shakar", label: "Shakar", emoji: "🍬", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["shakar"] },
  { id: "asal", label: "Asal", emoji: "🍯", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["asal"] },
  { id: "zira", label: "Zira", emoji: "🌿", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["zira"] },
  { id: "qora_murch", label: "Qora murch", emoji: "🌶️", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["qora murch"] },
  { id: "kunjut", label: "Kunjut", emoji: "⚪", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["kunjut"] },

  { id: "qaymoq", label: "Qaymoq", emoji: "🍦", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["qaymoq"] },
  { id: "sgushonka", label: "Sgushonka", emoji: "🥫", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["sgushonka", "quyuq sut"] },
  { id: "shokolad", label: "Shokolad", emoji: "🍫", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["shokolad"] },
  { id: "pechenye", label: "Pechenye", emoji: "🍪", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["pechenye", "pecheniye"] },
  { id: "vanilin", label: "Vanilin", emoji: "🌼", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["vanilin", "vanil"] },
  { id: "kokos", label: "Kokos qirindisi", emoji: "🥥", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["kokos"] },
  { id: "jem", label: "Jem / murabbo", emoji: "🍓", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["jem", "murabbo", "povidlo"] },
  { id: "razrixlitel", label: "Razrixlitel (xamir kukuni)", emoji: "🧁", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["razrixlitel"] }
];

async function ensureSeeded(db) {
  const snap = await db.collection("pantryIngredients").limit(1).get();
  if (!snap.empty) return;

  const batch = db.batch();
  for (const item of SEED_INGREDIENTS) {
    const { id, ...data } = item;
    batch.set(db.collection("pantryIngredients").doc(id), data);
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
      const type = req.query.type || "ingredients";

      if (type === "ingredients") {
        await ensureSeeded(db);
        const snapshot = await db.collection("pantryIngredients").get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(items);
      }

      if (type === "suggestions") {
        const snapshot = await db.collection("pantrySuggestions")
          .where("status", "==", "pending")
          .get();
        const items = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.occurrences || 0) - (a.occurrences || 0));
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
