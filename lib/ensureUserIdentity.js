// ===== Foydalanuvchi ism/username'ini sinxronlab turish =====
// Mini App'ning istalgan API endpoint'i orqali kirgan foydalanuvchi uchun
// ham (botning /start orqali emas) ism/username Firestore'da to'g'ri va
// yangi turishini ta'minlaydi. Bot tomonidagi bot.js'dagi ensureUser bilan
// bir xil maqsad — faqat Mini App tarafi uchun.
async function ensureUserIdentity(db, tgUser) {
  if (!tgUser || !tgUser.id) return;

  const userRef = db.collection("users").doc(String(tgUser.id));
  const fresh = {
    firstName: tgUser.first_name || "",
    username: tgUser.username || ""
  };

  try {
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        ...fresh,
        createdAt: Date.now(),
        isPremium: false,
        premiumUntil: null,
        trialUsed: false,
        language: null,
        notificationsEnabled: true
      });
      return;
    }

    const data = doc.data();
    if (data.firstName !== fresh.firstName || data.username !== fresh.username) {
      await userRef.set(fresh, { merge: true });
    }
  } catch (err) {
    console.error("ensureUserIdentity xatosi:", err);
  }
}

module.exports = { ensureUserIdentity };
