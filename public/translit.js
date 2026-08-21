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
  const s = String(str).toLowerCase().split("").map(ch => CYR_TO_LAT_MAP[ch] ?? ch).join("");
  return s.replace(/(^|[\s,.()\-])(\S)/g, (m, sep, ch) => sep + ch.toUpperCase());
}

// Matnda kirill harflari bormi — shu orqali qaysi alifboda kiritilganini aniqlaymiz
function hasCyrillic(str) {
  return /[\u0400-\u04FF]/.test(String(str || ""));
}

// Matnni joriy tilga mos ko'rsatish (admin lotincha ham, kirillcha ham
// kiritishi mumkin — qaysi alifboda kiritilganini avtomatik aniqlab,
// kerakli tomonga o'giramiz)
function displayText(str) {
  if (!str) return str;
  const lang = getCurrentLang();
  const isCyr = hasCyrillic(str);
  if (lang === "uzk") {
    return isCyr ? str : latinToCyrillic(str);
  }
  return isCyr ? cyrillicToLatin(str) : str;
}

// Retsept nomi uchun: admin qo'lda kirillcha nom kiritgan bo'lsa (titleCyrillic),
// o'shani ishlatadi — aks holda title maydonining o'zi qaysi alifboda
// yozilganini aniqlab, kerak bo'lsa avtomatik o'giradi.
function displayTitle(r) {
  const lang = getCurrentLang();
  if (lang === "uzk") {
    if (r.titleCyrillic && r.titleCyrillic.trim()) return r.titleCyrillic;
    return hasCyrillic(r.title) ? r.title : latinToCyrillic(r.title);
  }
  return hasCyrillic(r.title) ? cyrillicToLatin(r.title) : r.title;
}
  
