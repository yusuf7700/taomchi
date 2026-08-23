// ===== Taomchi — "Uyda nima bor?" moslik hisoblash logikasi =====
// Retseptlarning ingredient matnlari (masalan "2 dona tovuq grudinkasi")
// admin panelda erkin matn ko'rinishida kiritiladi — alohida strukturaga
// ega emas. Shu sababli bu yerda matn ichidan asosiy mahsulot so'zini
// (PANTRY_INGREDIENTS ro'yxatidagi keyword'lar orqali) qidirib topamiz.
// Bu Firestore'dagi eski retseptlarni ham o'zgartirmasdan ishlaydi.

function normalizeForMatch(str) {
  if (!str) return "";
  const s = hasCyrillic(str) ? cyrillicToLatin(str) : String(str);
  return s.toLowerCase();
}

function toWords(str) {
  return normalizeForMatch(str).split(/[^a-z']+/).filter(Boolean);
}

// Ketma-ket so'zlar ko'rinishida "keywordWords" ro'yxati "textWords" ichida
// bormi — shu orqali "un" so'zi "kungaboqar" kabi so'zlar ichiga tasodifan
// tushib qolmasligini ta'minlaymiz (so'z chegarasi bo'yicha solishtirish).
function containsPhrase(textWords, keywordWords) {
  if (keywordWords.length === 0) return false;
  for (let i = 0; i <= textWords.length - keywordWords.length; i++) {
    let ok = true;
    for (let j = 0; j < keywordWords.length; j++) {
      if (textWords[i + j] !== keywordWords[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// Retseptning ingredient matnlaridan qaysi asosiy mahsulotlar (id) borligini
// aniqlaydi. Natija — Set(masalan: {"tovuq", "kartoshka", "piyoz"})
function getRecipeIngredientIds(recipe) {
  const ids = new Set();
  const lines = (recipe.ingredients || []).map(i => i.name || "");

  for (const line of lines) {
    const words = toWords(line);
    if (words.length === 0) continue;

    for (const item of PANTRY_INGREDIENTS) {
      if (ids.has(item.id)) continue;
      for (const kw of item.keywords) {
        const kwWords = kw.toLowerCase().split(/[^a-z']+/).filter(Boolean);
        if (containsPhrase(words, kwWords)) {
          ids.add(item.id);
          break;
        }
      }
    }
  }
  return ids;
}

// Bitta retsept uchun moslik natijasini hisoblaydi.
// Qaytaradi: null (agar retseptda hech qanday taniqli mahsulot topilmasa —
// bu funksiyada ko'rsatilmaydi) yoki { requiredCount, missing, status }
// status: "full" — barcha mahsulot bor, "partial" — ba'zi mahsulot yetmaydi
function matchRecipe(recipe, selectedIds) {
  const requiredIds = getRecipeIngredientIds(recipe);
  if (requiredIds.size === 0) return null;

  const missing = [...requiredIds].filter(id => !selectedIds.has(id));
  return {
    requiredCount: requiredIds.size,
    missing,
    status: missing.length === 0 ? "full" : "partial"
  };
}
