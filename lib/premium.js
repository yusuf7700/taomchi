// ===== Taomchi — Premium obuna (Telegram Stars orqali) =====
// Firestore users/{userId} hujjatida saqlanadigan maydonlar:
//   premiumUntil        — Premium tugaydigan vaqt (ms, Date.now() bilan solishtiriladi)
//   premiumTrialClaimed — 3 kunlik bepul sovg'a allaqachon olinganmi (bool)

const MONTHLY_STARS_PRICE = 77;
const MONTHLY_DURATION_DAYS = 30;
const YEARLY_STARS_PRICE = 777;
const YEARLY_DURATION_DAYS = 365;
const TRIAL_DURATION_DAYS = 3;

function daysToMs(days) {
  return days * 24 * 60 * 60 * 1000;
}

function planDurationDays(plan) {
  return plan === "yearly" ? YEARLY_DURATION_DAYS : MONTHLY_DURATION_DAYS;
}

function planStarsPrice(plan) {
  return plan === "yearly" ? YEARLY_STARS_PRICE : MONTHLY_STARS_PRICE;
}

// Foydalanuvchining joriy Premium holatini qaytaradi.
async function getPremiumStatus(db, userId) {
  const doc = await db.collection("users").doc(String(userId)).get();
  const data = doc.exists ? doc.data() : {};
  const until = data.premiumUntil || 0;
  const active = until > Date.now();
  const daysLeft = active ? Math.ceil((until - Date.now()) / daysToMs(1)) : 0;
  const trialClaimed = data.premiumTrialClaimed === true;

  return {
    active,
    daysLeft,
    trialAvailable: !trialClaimed && !active,
    monthlyStarsPrice: MONTHLY_STARS_PRICE,
    yearlyStarsPrice: YEARLY_STARS_PRICE,
    trialDays: TRIAL_DURATION_DAYS
  };
}

// 3 kunlik bepul sovg'a — faqat 1 marta, foydalanuvchi o'zi "Ishlatish"ni bossa.
async function claimPremiumTrial(db, userId) {
  const userRef = db.collection("users").doc(String(userId));

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const data = doc.exists ? doc.data() : {};

    if (data.premiumTrialClaimed === true) {
      return { success: false, reason: "already_claimed" };
    }
    if ((data.premiumUntil || 0) > Date.now()) {
      return { success: false, reason: "already_active" };
    }

    const until = Date.now() + daysToMs(TRIAL_DURATION_DAYS);
    tx.set(userRef, { premiumUntil: until, premiumTrialClaimed: true }, { merge: true });
    return { success: true, until };
  });
}

// To'lov muvaffaqiyatli o'tgach chaqiriladi. Agar hozir ham Premium faol
// bo'lsa, muddatga qo'shib boradi (muddatidan oldin sotib olsa yo'qotmasin).
async function activatePremiumSubscription(db, userId, plan) {
  const userRef = db.collection("users").doc(String(userId));
  const durationMs = daysToMs(planDurationDays(plan));

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const data = doc.exists ? doc.data() : {};
    const current = data.premiumUntil || 0;
    const base = current > Date.now() ? current : Date.now();
    tx.set(userRef, { premiumUntil: base + durationMs }, { merge: true });
  });
}

module.exports = {
  MONTHLY_STARS_PRICE,
  MONTHLY_DURATION_DAYS,
  YEARLY_STARS_PRICE,
  YEARLY_DURATION_DAYS,
  TRIAL_DURATION_DAYS,
  planStarsPrice,
  getPremiumStatus,
  claimPremiumTrial,
  activatePremiumSubscription
};
