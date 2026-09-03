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

module.exports = { PRIVATE_FIELDS, splitRecipeFields };
