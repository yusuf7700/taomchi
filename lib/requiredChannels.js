// ===== Taomchi — Majburiy obuna kanallari =====
// Firestore "requiredChannels" kolleksiyasi hujjatlari:
//   channelId  — "@kanalusername" (@ bilan)
//   title      — admin panelda ko'rsatiladigan nom (ixtiyoriy)
//   expiresAt  — muddat tugaydigan vaqt (ms) yoki null (doimiy)
//   addedAt    — qo'shilgan vaqt (ms)

const COLLECTION = "requiredChannels";

function normalizeChannelId(raw) {
  const trimmed = String(raw || "").trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

// Faqat hozir faol (muddati tugamagan) kanallarni qaytaradi.
async function getActiveChannels(db) {
  const snapshot = await db.collection(COLLECTION).get();
  const now = Date.now();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((ch) => !ch.expiresAt || ch.expiresAt > now);
}

async function addChannel(db, channelId, title, expiresInDays) {
  const expiresAt = Number(expiresInDays) > 0 ? Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000 : null;
  const docRef = await db.collection(COLLECTION).add({
    channelId: normalizeChannelId(channelId),
    title: title || "",
    expiresAt,
    addedAt: Date.now()
  });
  return { id: docRef.id, expiresAt };
}

async function removeChannel(db, docId) {
  await db.collection(COLLECTION).doc(String(docId)).delete();
}

module.exports = {
  getActiveChannels,
  addChannel,
  removeChannel,
  normalizeChannelId
};
