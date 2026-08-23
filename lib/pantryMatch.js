// ===== Taomchi — server tarafida ingredient matnini tahlil qilish =====
// Bu fayl faqat api/ papkasidagi funksiyalarda ishlatiladi (Node.js, CommonJS).
// public/translit.js va public/pantry-match.js'dagi mantiqning server nusxasi —
// brauzerdagi kod bilan bir xil natija berishi uchun ataylab bir xil qilingan.

const CYR_TO_LAT_MAP = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "j", "з": "z",
  "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
  "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x", "ц": "ts", "ч": "ch", "ш": "sh",
  "ъ": "'", "ы": "i", "ь": "", "э": "e", "ю": "yu", "я": "ya", "ў": "o'", "қ": "q",
  "ғ": "g'", "ҳ": "h"
};

function hasCyrillic(str) {
  return /[\u0400-\u04FF]/.test(String(str || ""));
}

function cyrillicToLatin(str) {
  if (!str) return str;
  return String(str).toLowerCase().split("").map(ch => CYR_TO_LAT_MAP[ch] ?? ch).join("");
}

function normalizeForMatch(str) {
  if (!str) return "";
  const s = hasCyrillic(str) ? cyrillicToLatin(str) : String(str);
  return s.toLowerCase();
}

function toWords(str) {
  return normalizeForMatch(str).split(/[^a-z']+/).filter(Boolean);
}

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

// O'lchov birliklari, sonlar va umumiy sifatlovchi so'zlar — bular hech qachon
// "yangi mahsulot" sifatida taklif qilinmaydi (juda ko'p keraksiz taklif hosil bo'lmasligi uchun)
const STOPWORDS = new Set([
  "dona", "ta", "kg", "gr", "gramm", "litr", "ml", "stakan", "qoshiq", "osh", "choy",
  "banka", "pachka", "bosh", "tup", "shoda", "bo'lak", "qadoq", "paket",
  "katta", "kichik", "yangi", "quruq", "iliq", "sovuq", "issiq",
  "mayda", "maydalangan", "maydalab", "tuzlangan", "qaynatilgan", "qaynagan",
  "pishirilgan", "qovurilgan", "yupqa", "yumshoq", "qattiq", "ivitilgan",
  "kesilgan", "kesib", "tozalangan", "yuvilgan", "arralangan", "qadar",
  "bo'yicha", "uchun", "ozgina", "kerak", "ixtiyoriy", "yoki", "va", "bilan"
]);

// Bitta retseptning ingredient qatorlari va joriy tasdiqlangan mahsulotlar
// ro'yxati (keywords bilan) asosida — hali tanilmagan so'zlarni topadi.
// canonicalItems: [{ keywords: ["tovuq"] }, ...]
// Qaytaradi: Set(masalan {"tvarog", "lotus"})
function extractUnmatchedWords(ingredientLines, canonicalItems) {
  const unmatched = new Set();

  for (const line of ingredientLines) {
    const words = toWords(line);
    if (words.length === 0) continue;

    const matchedIndexes = new Set();
    for (const item of canonicalItems) {
      for (const kw of (item.keywords || [])) {
        const kwWords = String(kw).toLowerCase().split(/[^a-z']+/).filter(Boolean);
        for (let i = 0; i <= words.length - kwWords.length; i++) {
          let ok = true;
          for (let j = 0; j < kwWords.length; j++) {
            if (words[i + j] !== kwWords[j]) { ok = false; break; }
          }
          if (ok) {
            for (let j = 0; j < kwWords.length; j++) matchedIndexes.add(i + j);
          }
        }
      }
    }

    words.forEach((w, idx) => {
      if (matchedIndexes.has(idx)) return;
      if (w.length < 3) return;
      if (STOPWORDS.has(w)) return;
      unmatched.add(w);
    });
  }

  return unmatched;
}

function slugify(word) {
  return String(word).toLowerCase().replace(/[^a-z0-9']/g, "").slice(0, 40);
}

module.exports = {
  hasCyrillic,
  cyrillicToLatin,
  normalizeForMatch,
  toWords,
  containsPhrase,
  extractUnmatchedWords,
  slugify,
  STOPWORDS
};
