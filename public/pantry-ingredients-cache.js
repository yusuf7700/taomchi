// ===== Taomchi — "Uyda nima bor?" mahsulotlari keshi =====
// Admin panelda tasdiqlangan mahsulotlar Firestore'ning "pantryIngredients"
// to'plamida saqlanadi. Ro'yxat kichik (bir necha o'nlab yozuv) bo'lgani
// uchun — retseptlardan farqli o'laroq — bu yerda kesh faqat "darrov
// ko'rsatish" uchun ishlatiladi, lekin har safar baribir orqa fonda
// Firestore'dan yangilanadi (shunda admin tasdiqlagan mahsulot darrov
// ko'rinadi, 10 daqiqa kutish shart emas).

const PANTRY_ING_CACHE_KEY = "taomchi_pantry_ingredients_cache";

function getCachedPantryIngredients() {
  try {
    const raw = localStorage.getItem(PANTRY_ING_CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

function setCachedPantryIngredients(data) {
  try {
    localStorage.setItem(PANTRY_ING_CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // localStorage to'lib qolgan bo'lishi mumkin, e'tiborsiz qoldiramiz
  }
}

// onUpdate(items) — kesh yoki server'dan har safar yangi ma'lumot kelganda chaqiriladi
// items: [{ id, label, emoji, groupId, groupLabel, keywords }, ...]
function loadPantryIngredientsWithCache(onUpdate) {
  const cached = getCachedPantryIngredients();
  if (cached) onUpdate(cached, /* fromCache */ true);

  // Kesh bor-yo'qligidan qat'i nazar, har doim Firestore'dan yangisini olib kelamiz
  db.collection("pantryIngredients").get()
    .then(snapshot => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCachedPantryIngredients(items);
      onUpdate(items, /* fromCache */ false);
    })
    .catch(err => {
      console.error("Pantry mahsulotlarini yuklashda xato:", err);
      if (!cached) onUpdate(PANTRY_FALLBACK_INGREDIENTS, false);
    });
}
