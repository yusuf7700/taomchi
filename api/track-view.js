// ===== Ovqaty — Retsept ko'rishlar sonini oshirish =====
// POST /api/track-view   body: { recipeId }
//
// "Ko'p ko'rilgan" saralash uchun. Ochiq (auth talab qilinmaydi) —
// faqat bitta raqamni +1 qiladi, maxfiy yoki shaxsiy ma'lumot emas.
// recipe-detail.html ochilganda avtomatik chaqiriladi.

const { getDb } = require("../lib/firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  }

  const { recipeId } = req.body || {};
  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "recipeId kerak" });
  }

  try {
    const db = getDb();
    await db.collection("recipes").doc(recipeId).set(
      { viewCount: FieldValue.increment(1) },
      { merge: true }
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    // Sahifa ko'rsatilishiga to'sqinlik qilmasin — xatoni faqat log qilamiz
    console.error("track-view xatosi:", err);
    return res.status(200).json({ success: false });
  }
};
