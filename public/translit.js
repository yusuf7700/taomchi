// ===== Taomchi — Lotin ↔ Kirill avtomatik o'girish =====
// Admin panelda retseptlar faqat LOTIN alifbosida kiritiladi.
// Foydalanuvchi Kirill tanlasa, shu fayl matnni avtomatik kirillga o'giradi.
// Qidiruvda esa kirill yozilsa, lotinga o'girib solishtiramiz.

// --- Lotin → Kirill (ko'rsatish uchun) ---
const LAT_TO_CYR_PAIRS = [
  ["sh", "ш"], ["ch", "ч"], ["yo", "ё"], ["yu", "ю"], ["ya", "я"],
  ["o'", "ў"], ["g'", "ғ"], ["o‘", "ў"], ["g‘", "ғ"],
  ["a", "а"], ["b", "б"], ["d", "д"], ["e", "е"], ["f", "ф"], ["g", "г"],
  ["h", "ҳ"], ["i", "и"], ["j", "ж"], ["k", "к"], ["l", "л"], ["m", "м"],
  ["n", "н"], ["o", "о"], ["p", "п"], ["q", "қ"], ["r", "р"], ["s", "с"],
  ["t", "т"], ["u", "у"], ["v", "в"], ["x", "х"], ["y", "й"], ["z", "з"],
  ["c", "ц"], ["w", "в"]
];

function latinToCyrillic(str) {
  if (!str) return str;
  let s = String(str).toLowerCase();
  for (const [lat, cyr] of LAT_TO_CYR_PAIRS) {
    s = s.split(lat).join(cyr);
  }
  // Har bir so'zning birinchi harfini bosh harf qilib qo'yamiz
  return s.replace(/(^|[\s,.()\-])(\S)/g, (m, sep, ch) => sep + ch.toUpperCase());
}

// --- Kirill → Lotin (qidiruv uchun) ---
const CYR_TO_LAT_MAP = {
  "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"j","з":"z",
  "и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r",
  "с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"ts","ч":"ch","ш":"sh",
  "ъ":"'","ы":"i","ь":"","э":"e","ю":"yu","я":"ya","ў":"o'","қ":"q",
  "ғ":"g'","ҳ":"h"
};

function cyrillicToLatin(str) {
  if (!str) return str;
  return String(str).toLowerCase().split("").map(ch => CYR_TO_LAT_MAP[ch] ?? ch).join("");
}

// Matnni joriy tilga mos ko'rsatish (Firestore'da hammasi lotincha saqlanadi)
function displayText(str) {
  if (!str) return str;
  return getCurrentLang() === "uzk" ? latinToCyrillic(str) : str;
}

// Retsept nomi uchun: agar admin qo'lda kirillcha nom kiritgan bo'lsa
// (titleCyrillic), o'shani ishlatadi — aks holda avtomatik o'giradi.
function displayTitle(r) {
  if (getCurrentLang() === "uzk") {
    return (r.titleCyrillic && r.titleCyrillic.trim()) ? r.titleCyrillic : latinToCyrillic(r.title);
  }
  return r.title;
}
