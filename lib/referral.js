// ===== Taomchi — Referal ballari tizimi =====
// Firestore users/{userId} hujjatidagi maydonlar:
//   points           — foydalanuvchining joriy ball miqdori
//   referredBy       — uni kim taklif qilgani (bir marta, qayta hisoblanmasin)
//   unlockedRecipes  — ball evaziga ochilgan premium retseptlar ID massivi

const REFERRAL_POINTS_PER_INVITE = 1;
const RECIPE_UNLOCK_COST = 3;

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
    redeemCost: RECIPE_UNLOCK_COST
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

module.exports = {
  REFERRAL_POINTS_PER_INVITE,
  RECIPE_UNLOCK_COST,
  creditReferral,
  getReferralStatus,
  redeemRecipeUnlock
};
