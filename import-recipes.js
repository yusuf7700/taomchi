// ===== Taomchi — retseptlarni Firestore'ga yuklash =====
//
// ISHLATISH:
// 1. Firebase Console → Project settings → Service accounts →
//    "Generate new private key" tugmasini bosing, yuklab olingan
//    faylni shu papkaga "serviceAccountKey.json" nomi bilan saqlang.
//    (BU FAYLNI HECH QACHON GitHub'ga qo'ymang — .gitignore'ga qo'shing!)
//
// 2. Terminal orqali shu papkaga kirib:
//    npm install firebase-admin
//    node import-recipes.js
//
// 3. recipes-sample.json ichidagi retseptlarni to'ldirib/ko'paytirib,
//    shu skriptni istalgancha marta qayta ishga tushirishingiz mumkin.

const admin = require("firebase-admin");
const recipes = require("./recipes-sample.json");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importRecipes() {
  const batch = db.batch();

  recipes.forEach(recipe => {
    const ref = db.collection("recipes").doc(); // avtomatik ID
    batch.set(ref, recipe);
  });

  await batch.commit();
  console.log(`✅ ${recipes.length} ta retsept muvaffaqiyatli qo'shildi.`);
}

importRecipes().catch(err => {
  console.error("❌ Xatolik:", err);
});