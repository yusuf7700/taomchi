// ===== Taomchi — "Uyda nima bor?" uchun server tomonidagi kalit so'zlar =====
//
// MUHIM: bu ro'yxat public/pantry-data.js dagi PANTRY_GROUPS bilan SINXRON
// bo'lishi kerak. Agar u yerga yangi mahsulot qo'shsangiz yoki keyword
// o'zgartirsangiz, SHU YERGA HAM xuddi shunday o'zgartiring — aks holda
// "Uyda nima bor?" funksiyasi yangi retseptlarda mos kelmasligi mumkin.
//
// Nega alohida fayl: retsept ingredientlari (to'liq matn, miqdorlar bilan)
// endi faqat serverda saqlanadi (Premium kontentni himoya qilish uchun).
// Lekin pantry-match — mijozda (brauzerda) ishlaydigan funksiya, shuning
// uchun retsept saqlanganda SERVERDA oldindan faqat "qaysi mahsulotlar bor"
// degan xulosani (ID ro'yxatini) hisoblab, ochiq (public) hujjatga yozamiz —
// bu to'liq ingredient matnini oshkor qilmaydi, faqat umumiy mahsulot
// nomlarini (masalan "tovuq", "guruch") bildiradi.
const PANTRY_KEYWORD_ITEMS = [
  { id: "tovuq", keywords: ["tovuq"] },
  { id: "mol_goshti", keywords: ["mol go'shti", "sigir go'shti"] },
  { id: "qoy_goshti", keywords: ["qo'y go'shti", "qo'y go'sht"] },
  { id: "baliq", keywords: ["baliq"] },
  { id: "tuxum", keywords: ["tuxum"] },
  { id: "kartoshka", keywords: ["kartoshka"] },
  { id: "sabzi", keywords: ["sabzi"] },
  { id: "piyoz", keywords: ["piyoz"] },
  { id: "kok_piyoz", keywords: ["ko'k piyoz"] },
  { id: "pomidor", keywords: ["pomidor"] },
  { id: "bodring", keywords: ["bodring"] },
  { id: "qalampir", keywords: ["qalampir", "bolgar qalampiri"] },
  { id: "achchiq_qalampir", keywords: ["achchiq qalampir", "achchiq murch"] },
  { id: "baqlajon", keywords: ["baqlajon"] },
  { id: "kabachka", keywords: ["kabachka"] },
  { id: "sarimsoq", keywords: ["sarimsoq"] },
  { id: "karam", keywords: ["karam"] },
  { id: "sholgom", keywords: ["sholg'om"] },
  { id: "kashnich", keywords: ["kashnich"] },
  { id: "ukrop", keywords: ["ukrop"] },
  { id: "rayhon", keywords: ["rayhon"] },
  { id: "yalpiz", keywords: ["yalpiz", "myata"] },
  { id: "salat_barglari", keywords: ["salat barg", "salat"] },
  { id: "guruch", keywords: ["guruch"] },
  { id: "un", keywords: ["un"] },
  { id: "makaron", keywords: ["makaron"] },
  { id: "vermishel", keywords: ["vermishel"] },
  { id: "noxat", keywords: ["no'xat"] },
  { id: "loviya", keywords: ["loviya"] },
  { id: "mosh", keywords: ["mosh"] },
  { id: "non", keywords: ["non"] },
  { id: "sut", keywords: ["sut"] },
  { id: "qatiq", keywords: ["qatiq"] },
  { id: "tvorog", keywords: ["tvorog", "tvarog", "tvarojniy"] },
  { id: "smetana", keywords: ["smetana"] },
  { id: "sir", keywords: ["sir", "pishloq"] },
  { id: "sariyog", keywords: ["sariyog'"] },
  { id: "margarin", keywords: ["margarin"] },
  { id: "limon", keywords: ["limon"] },
  { id: "olma", keywords: ["olma"] },
  { id: "uzum", keywords: ["uzum"] },
  { id: "banan", keywords: ["banan"] },
  { id: "behi", keywords: ["behi"] },
  { id: "anor", keywords: ["anor"] },
  { id: "qulupnay", keywords: ["qulupnay"] },
  { id: "shaftoli", keywords: ["shaftoli"] },
  { id: "qaymoq", keywords: ["qaymoq"] },
  { id: "sgushonka", keywords: ["sgushonka", "quyuq sut"] },
  { id: "shokolad", keywords: ["shokolad"] },
  { id: "pechenye", keywords: ["pechenye", "pecheniye"] },
  { id: "vanilin", keywords: ["vanilin", "vanil"] },
  { id: "kokos", keywords: ["kokos"] },
  { id: "jem", keywords: ["jem", "murabbo", "povidlo"] },
  { id: "razrixlitel", keywords: ["razrixlitel"] },
  { id: "osimlik_yogi", keywords: ["o'simlik yog'i", "kungaboqar yog'i"] },
  { id: "tomat_pasta", keywords: ["tomat past"] },
  { id: "shakar", keywords: ["shakar"] },
  { id: "asal", keywords: ["asal"] },
  { id: "tuz", keywords: ["tuz"] },
  { id: "limon_tuzi", keywords: ["limon tuzi"] },
  { id: "zira", keywords: ["zira"] },
  { id: "qora_murch", keywords: ["qora murch"] },
  { id: "kunjut", keywords: ["kunjut"] },
  { id: "choy", keywords: ["choy"] }
];

// public/translit.js dagi CYR_TO_LAT_MAP bilan bir xil mantiq (soddalashtirilgan,
// faqat kalit so'z qidiruv uchun — to'liq matnni ko'rsatish uchun emas).
const CYR_TO_LAT_SIMPLE = {
  "ш": "sh", "ч": "ch", "ё": "yo", "ю": "yu", "я": "ya",
  "ў": "o'", "ғ": "g'", "а": "a", "б": "b", "д": "d", "е": "e",
  "ф": "f", "г": "g", "ҳ": "h", "и": "i", "ж": "j", "к": "k",
  "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "қ": "q",
  "р": "r", "с": "s", "т": "t", "у": "u", "в": "v", "х": "x",
  "й": "y", "з": "z", "ц": "s", "ъ": "'", "э": "e"
};

function hasCyrillic(str) {
  return /[\u0400-\u04FF]/.test(String(str || ""));
}

function cyrillicToLatin(str) {
  return String(str || "").toLowerCase().split("").map(ch => CYR_TO_LAT_SIMPLE[ch] ?? ch).join("");
}

function toWords(str) {
  const s = hasCyrillic(str) ? cyrillicToLatin(str) : String(str || "");
  return s.toLowerCase().split(/[^a-z']+/).filter(Boolean);
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

// Ingredient matnlaridan (masalan [{name: "2 dona tovuq grudinkasi"}, ...])
// qaysi asosiy mahsulotlar (id) borligini aniqlaydi. Natija — string[] (masalan
// ["tovuq", "kartoshka", "piyoz"]) — bu retsept saqlanganda PUBLIC hujjatga
// yoziladi, "Uyda nima bor?" funksiyasi shuni ishlatadi.
function computeIngredientKeywordIds(ingredients) {
  const ids = new Set();
  const lines = (ingredients || []).map(i => i.name || "");

  for (const line of lines) {
    const words = toWords(line);
    if (words.length === 0) continue;

    for (const item of PANTRY_KEYWORD_ITEMS) {
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

  return [...ids];
}

module.exports = { computeIngredientKeywordIds };
