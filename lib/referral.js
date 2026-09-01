// ===== Taomchi — Referal ballari tizimi =====
// Firestore users/{userId} hujjatidagi maydonlar:
//   points           — foydalanuvchining joriy ball miqdori
//   referredBy       — uni kim taklif qilgani (bir marta, qayta hisoblanmasin)
//   unlockedRecipes  — ball evaziga ochilgan premium retseptlar ID massivi

const REFERRAL_POINTS_PER_INVITE = 1;
const RECIPE_UNLOCK_COST = 3;
const AI_BONUS_COST = 2;
const PREMIUM_3D_COST = 8;
const PREMIUM_3D_DAYS = 3;
const PREMIUM_30D_COST = 20;
const PREMIUM_30D_DAYS = 30;

function daysToMs(days) {
  return days * 24 * 60 * 60 * 1000;
}

// Yangi foydalanuvchi referal havola orqali kirganda chaqiriladi.
// Faqat 1 marta hisoblanadi (referredBy allaqachon bo'lsa — qayta bermaydi).
async function creditReferral(db, referrerId, newUserId) {
  if (String(referrerId) === String(newUserId)) {
    return { success: false, reason: "self" };
  }

  const referrerRef = db.collection("users").doc(String(referrerId));
  const newUserRef = db.collection("users").doc(String(newUserId));

  return db.runTransaction(async (tx) => {
    const [referrerDoc, newUserDoc] = await Promise.all([tx.get(referrerRef), tx.get(newUserRef)]);

    if (!referrerDoc.exists) return { success: false, reason: "referrer_not_found" };

    const newUserData = newUserDoc.exists ? newUserDoc.data() : {};
    if (newUserData.referredBy) return { success: false, reason: "already_referred" };

    const currentPoints = referrerDoc.data().points || 0;
    tx.set(referrerRef, { points: currentPoints + REFERRAL_POINTS_PER_INVITE }, { merge: true });
    tx.set(newUserRef, { referredBy: String(referrerId) }, { merge: true });

    return { success: true };
  });
}

// Foydalanuvchining ball va ochilgan retseptlar holatini qaytaradi.
async function getReferralStatus(db, userId) {
  const doc = await db.collection("users").doc(String(userId)).get();
  const data = doc.exists ? doc.data() : {};
  return {
    points: data.points || 0,
    unlockedRecipes: data.unlockedRecipes || [],
    redeemCost: RECIPE_UNLOCK_COST,
    aiBonusCost: AI_BONUS_COST,
    premium3dCost: PREMIUM_3D_COST,
    premium30dCost: PREMIUM_30D_COST
  };
}

// Ball evaziga bitta premium retseptni ochish.
async function redeemRecipeUnlock(db, userId, recipeId) {
  const userRef = db.collection("users").doc(String(userId));
  const recipeRef = db.collection("recipes").doc(String(recipeId));

  return db.runTransaction(async (tx) => {
    const [userDoc, recipeDoc] = await Promise.all([tx.get(userRef), tx.get(recipeRef)]);

    if (!recipeDoc.exists) return { success: false, reason: "recipe_not_found" };

    const userData = userDoc.exists ? userDoc.data() : {};
    const points = userData.points || 0;
    const unlocked = userData.unlockedRecipes || [];

    if (unlocked.includes(String(recipeId))) return { success: false, reason: "already_unlocked" };
    if (points < RECIPE_UNLOCK_COST) return { success: false, reason: "not_enough_points" };

    tx.set(userRef, {
      points: points - RECIPE_UNLOCK_COST,
      unlockedRecipes: [...unlocked, String(recipeId)]
    }, { merge: true });

    return { success: true, remainingPoints: points - RECIPE_UNLOCK_COST };
  });
}

// Ball evaziga +1 qo'shimcha AI so'rov (kunlik limitdan tashqari).
async function redeemAiBonus(db, userId) {
  const userRef = db.collection("users").doc(String(userId));

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const data = doc.exists ? doc.data() : {};
    const points = data.points || 0;

    if (points < AI_BONUS_COST) return { success: false, reason: "not_enough_points" };

    const bonusCredits = data.aiBonusCredits || 0;
    tx.set(userRef, {
      points: points - AI_BONUS_COST,
      aiBonusCredits: bonusCredits + 1
    }, { merge: true });

    return { success: true, remainingPoints: points - AI_BONUS_COST };
  });
}

// Ball evaziga Premium kunlar qo'shish (3 kunlik yoki 30 kunlik).
// Agar hozir ham Premium faol bo'lsa, muddatga qo'shib boradi.
async function redeemPremiumDays(db, userId, days, cost) {
  const userRef = db.collection("users").doc(String(userId));

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const data = doc.exists ? doc.data() : {};
    const points = data.points || 0;

    if (points < cost) return { success: false, reason: "not_enough_points" };

    const current = data.premiumUntil || 0;
    const base = current > Date.now() ? current : Date.now();
    tx.set(userRef, {
      points: points - cost,
      premiumUntil: base + daysToMs(days)
    }, { merge: true });

    return { success: true, remainingPoints: points - cost };
  });
}

module.exports = {
  REFERRAL_POINTS_PER_INVITE,
  RECIPE_UNLOCK_COST,
  AI_BONUS_COST,
  PREMIUM_3D_COST,
  PREMIUM_3D_DAYS,
  PREMIUM_30D_COST,
  PREMIUM_30D_DAYS,
  creditReferral,
  getReferralStatus,
  redeemRecipeUnlock,
  redeemAiBonus,
  redeemPremiumDays
};
