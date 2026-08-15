// ===== Taomchi — Firebase Admin ulanishi (server tarafida) =====
// Bu fayl faqat api/ papkasidagi funksiyalar ichida ishlatiladi.
// Maxfiy kalit Vercel'ning Environment Variables bo'limida
// FIREBASE_SERVICE_ACCOUNT nomi bilan (JSON matni sifatida) saqlanadi.

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

function getDb() {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

module.exports = { getDb };
