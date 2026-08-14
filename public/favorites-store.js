// ===== Taomchi — Saqlanganlar (localStorage) =====
// Hozircha backend/auth tayyor bo'lmagani uchun shu qurilmada saqlanadi.
// Keyinchalik Firestore'ga ko'chirish uchun shu fayldagi funksiyalarni
// almashtirish kifoya, boshqa joylarni o'zgartirish shart emas.

const FAVORITES_KEY = "taomchi_favorites";

function getFavoriteIds() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function isFavorite(recipeId) {
  return getFavoriteIds().includes(recipeId);
}

function toggleFavorite(recipeId) {
  const ids = getFavoriteIds();
  const index = ids.indexOf(recipeId);
  if (index === -1) {
    ids.push(recipeId);
  } else {
    ids.splice(index, 1);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  return ids.includes(recipeId); // true = endi saqlangan, false = olib tashlandi
}
