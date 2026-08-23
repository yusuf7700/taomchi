// ===== Taomchi — "Uyda nima bor?" mahsulotlari keshi =====
// Admin panelda tasdiqlangan mahsulotlar Firestore'ning "pantryIngredients"
// to'plamida saqlanadi. Bu fayl shuni recipes-cache.js bilan bir xil
// stale-while-revalidate andazasida yuklaydi.

const PANTRY_ING_CACHE_KEY = "taomchi_pantry_ingredients_cache";
const PANTRY_ING_CACHE_TTL = 10 * 60 * 1000; // 10 daqiqa

function getCachedPantryIngredients() {
  try {
    const raw = localStorage.getItem(PANTRY_ING_CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    return { data, isFresh: Date.now() - savedAt < PANTRY_ING_CACHE_TTL };
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

  if (cached) {
    onUpdate(cached.data, /* fromCache */ true);
    if (cached.isFresh) return;
  }

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
