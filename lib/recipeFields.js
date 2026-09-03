// ===== Taomchi — Retsept maydonlarini bo'lish (Premium himoyasi) =====
// Premium retseptning to'liq tarkibi (ingredientlar, tayyorlash tartibi,
// video manbasi) endi CLIENT Firestore orqali emas, faqat SERVER orqali
// (initData + Premium/ochilgan tekshiruvidan keyin) beriladi.
//
// Shuning uchun har bir retsept ikkiga bo'lingan holda saqlanadi:
//   recipes/{id}        — hamma ko'radigan "teaser": nom, rasm, vaqt, kategoriya
//   recipeContent/{id}  — himoyalangan: ingredientlar, qadamlar, video, kanal

const PRIVATE_FIELDS = ["ingredients", "steps", "author", "sourceUrl", "videoPlatform"];

function splitRecipeFields(data) {
  const publicFields = {};
  const privateFields = {};

  for (const [key, value] of Object.entries(data || {})) {
    if (PRIVATE_FIELDS.includes(key)) privateFields[key] = value;
    else publicFields[key] = value;
  }

  return { publicFields, privateFields };
}

// BIR MARTALIK migratsiya: eski retseptlarda hali ham `recipes/{id}`
// hujjatining o'zida saqlangan ingredient/steps/sourceUrl kabi maydonlarni
// `recipeContent/{id}`ga ko'chiradi va asl hujjatdan olib tashlaydi.
// Xavfsiz — allaqachon ko'chirilgan retseptlarni qayta ishlamaydi (idempotent).
async function migrateLegacyRecipeContent(db) {
  const { FieldValue } = require("firebase-admin/firestore");
  const { computeIngredientKeywordIds } = require("./pantryKeywords");

  const snapshot = await db.collection("recipes").get();
  let migrated = 0, skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasLegacyFields = PRIVATE_FIELDS.some(f => f in data);
    if (!hasLegacyFields) { skipped++; continue; }

    const { publicFields, privateFields } = splitRecipeFields(data);
    publicFields.ingredientKeywordIds = computeIngredientKeywordIds(privateFields.ingredients);

    const deletions = {};
    PRIVATE_FIELDS.forEach(f => { deletions[f] = FieldValue.delete(); });

    await db.collection("recipes").doc(doc.id).set({ ...publicFields, ...deletions }, { merge: true });
    await db.collection("recipeContent").doc(doc.id).set(privateFields, { merge: true });
    migrated++;
  }

  return { migrated, skipped };
}

module.exports = { PRIVATE_FIELDS, splitRecipeFields, migrateLegacyRecipeContent };
