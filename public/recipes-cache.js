// ===== Taomchi — Retseptlar keshi =====
// Maqsad: har sahifa ochilganda Firestore'ga qayta so'rov yubormaslik.
// Birinchi marta keshdan (agar bor bo'lsa) darrov ko'rsatamiz, orqa fonda
// yangisini olib kelib, kesh eskirgan bo'lsa yangilaymiz (stale-while-revalidate).

const RECIPES_CACHE_KEY = "taomchi_recipes_cache";
const RECIPES_CACHE_TTL = 10 * 60 * 1000; // 10 daqiqa

function getCachedRecipes() {
  try {
    const raw = localStorage.getItem(RECIPES_CACHE_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    return { data, isFresh: Date.now() - savedAt < RECIPES_CACHE_TTL };
  } catch {
    return null;
  }
}

function setCachedRecipes(data) {
  try {
    localStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // localStorage to'lib qolgan bo'lishi mumkin, e'tiborsiz qoldiramiz
  }
}

// onUpdate(recipes) — kesh yoki server'dan har safar yangi ma'lumot kelganda chaqiriladi
function loadRecipesWithCache(onUpdate) {
  const cached = getCachedRecipes();

  if (cached) {
    onUpdate(cached.data, /* fromCache */ true);
    if (cached.isFresh) return; // kesh hali yangi, server'ga murojaat shart emas
  }

  db.collection("recipes").get()
    .then(snapshot => {
      const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCachedRecipes(recipes);
      onUpdate(recipes, /* fromCache */ false);
    })
    .catch(err => {
      console.error("Retseptlarni yuklashda xato:", err);
      if (!cached) onUpdate([], false); // kesh ham yo'q bo'lsa, bo'sh ro'yxat
    });
}
