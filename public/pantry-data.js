// ===== Taomchi — "Uyda nima bor?" guruh tartibi va zaxira ro'yxat =====
// Asosiy mahsulotlar ro'yxati endi Firestore'ning "pantryIngredients"
// to'plamida saqlanadi (admin panelda tasdiqlanadi, kod push qilmasdan
// yangilanadi) — pantry-ingredients-cache.js shuni yuklaydi.
//
// Bu fayl faqat ikkita narsa uchun kerak:
// 1) Guruhlarning ko'rsatish tartibi va o'zbekcha nomi (Firestore'da item
//    faqat groupId/groupLabel saqlaydi, tartibni bu yerda belgilaymiz)
// 2) Firestore'ga umuman ulanib bo'lmagan holatlar uchun zaxira ro'yxat
//    (masalan internet yo'q va kesh ham bo'sh bo'lsa)

const PANTRY_GROUP_ORDER = ["meat", "veg", "herbs", "grains", "dairy", "fruit", "dessert", "other"];

const PANTRY_GROUP_LABELS = {
  meat: "Go'sht, baliq va tuxum",
  veg: "Sabzavotlar",
  herbs: "Ko'katlar",
  grains: "Don va yormalar",
  dairy: "Sut mahsulotlari",
  fruit: "Mevalar",
  dessert: "Shirinlik mahsulotlari",
  other: "Boshqa mahsulotlar"
};

const PANTRY_FALLBACK_INGREDIENTS = [
  { id: "tovuq", label: "Tovuq go'shti", emoji: "🍗", groupId: "meat", keywords: ["tovuq"] },
  { id: "mol_goshti", label: "Mol go'shti", emoji: "🥩", groupId: "meat", keywords: ["mol go'shti", "sigir go'shti"] },
  { id: "qoy_goshti", label: "Qo'y go'shti", emoji: "🍖", groupId: "meat", keywords: ["qo'y go'shti", "qo'y go'sht"] },
  { id: "baliq", label: "Baliq", emoji: "🐟", groupId: "meat", keywords: ["baliq"] },
  { id: "tuxum", label: "Tuxum", emoji: "🥚", groupId: "meat", keywords: ["tuxum"] },

  { id: "kartoshka", label: "Kartoshka", emoji: "🥔", groupId: "veg", keywords: ["kartoshka"] },
  { id: "sabzi", label: "Sabzi", emoji: "🥕", groupId: "veg", keywords: ["sabzi"] },
  { id: "piyoz", label: "Piyoz", emoji: "🧅", groupId: "veg", keywords: ["piyoz"] },
  { id: "kok_piyoz", label: "Ko'k piyoz", emoji: "🌱", groupId: "veg", keywords: ["ko'k piyoz"] },
  { id: "pomidor", label: "Pomidor", emoji: "🍅", groupId: "veg", keywords: ["pomidor"] },
  { id: "bodring", label: "Bodring", emoji: "🥒", groupId: "veg", keywords: ["bodring"] },
  { id: "qalampir", label: "Qalampir (bulg'or)", emoji: "🫑", groupId: "veg", keywords: ["qalampir", "bolgar qalampiri"] },
  { id: "baqlajon", label: "Baqlajon", emoji: "🍆", groupId: "veg", keywords: ["baqlajon"] },
  { id: "kabachka", label: "Kabachka", emoji: "🥒", groupId: "veg", keywords: ["kabachka"] },
  { id: "sarimsoq", label: "Sarimsoq piyoz", emoji: "🧄", groupId: "veg", keywords: ["sarimsoq"] },
  { id: "karam", label: "Karam", emoji: "🥬", groupId: "veg", keywords: ["karam"] },
  { id: "sholgom", label: "Sholg'om", emoji: "🥔", groupId: "veg", keywords: ["sholg'om"] },

  { id: "kashnich", label: "Kashnich", emoji: "🌿", groupId: "herbs", keywords: ["kashnich"] },
  { id: "ukrop", label: "Ukrop", emoji: "🌿", groupId: "herbs", keywords: ["ukrop"] },
  { id: "rayhon", label: "Rayhon", emoji: "🌿", groupId: "herbs", keywords: ["rayhon"] },
  { id: "salat_barglari", label: "Salat barglari", emoji: "🥬", groupId: "herbs", keywords: ["salat barg", "salat"] },

  { id: "guruch", label: "Guruch", emoji: "🍚", groupId: "grains", keywords: ["guruch"] },
  { id: "un", label: "Un", emoji: "🌾", groupId: "grains", keywords: ["un"] },
  { id: "makaron", label: "Makaron", emoji: "🍝", groupId: "grains", keywords: ["makaron"] },
  { id: "noxat", label: "No'xat", emoji: "🫘", groupId: "grains", keywords: ["no'xat"] },
  { id: "loviya", label: "Loviya", emoji: "🫘", groupId: "grains", keywords: ["loviya"] },
  { id: "mosh", label: "Mosh", emoji: "🫘", groupId: "grains", keywords: ["mosh"] },

  { id: "sut", label: "Sut", emoji: "🥛", groupId: "dairy", keywords: ["sut"] },
  { id: "qatiq", label: "Qatiq", emoji: "🥛", groupId: "dairy", keywords: ["qatiq"] },
  { id: "tvorog", label: "Tvorog", emoji: "🧀", groupId: "dairy", keywords: ["tvorog", "tvarog", "tvarojniy"] },
  { id: "smetana", label: "Smetana", emoji: "🥄", groupId: "dairy", keywords: ["smetana"] },
  { id: "sir", label: "Sir (pishloq)", emoji: "🧀", groupId: "dairy", keywords: ["sir", "pishloq"] },
  { id: "sariyog", label: "Sariyog'", emoji: "🧈", groupId: "dairy", keywords: ["sariyog'"] },

  { id: "limon", label: "Limon", emoji: "🍋", groupId: "fruit", keywords: ["limon"] },
  { id: "olma", label: "Olma", emoji: "🍎", groupId: "fruit", keywords: ["olma"] },
  { id: "uzum", label: "Uzum", emoji: "🍇", groupId: "fruit", keywords: ["uzum"] },
  { id: "banan", label: "Banan", emoji: "🍌", groupId: "fruit", keywords: ["banan"] },

  { id: "qaymoq", label: "Qaymoq", emoji: "🍦", groupId: "dessert", keywords: ["qaymoq"] },
  { id: "sgushonka", label: "Sgushonka", emoji: "🥫", groupId: "dessert", keywords: ["sgushonka", "quyuq sut"] },
  { id: "shokolad", label: "Shokolad", emoji: "🍫", groupId: "dessert", keywords: ["shokolad"] },
  { id: "pechenye", label: "Pechenye", emoji: "🍪", groupId: "dessert", keywords: ["pechenye", "pecheniye"] },
  { id: "vanilin", label: "Vanilin", emoji: "🌼", groupId: "dessert", keywords: ["vanilin", "vanil"] },
  { id: "kokos", label: "Kokos qirindisi", emoji: "🥥", groupId: "dessert", keywords: ["kokos"] },
  { id: "jem", label: "Jem / murabbo", emoji: "🍓", groupId: "dessert", keywords: ["jem", "murabbo", "povidlo"] },
  { id: "razrixlitel", label: "Razrixlitel (xamir kukuni)", emoji: "🧁", groupId: "dessert", keywords: ["razrixlitel"] },

  { id: "osimlik_yogi", label: "O'simlik yog'i", emoji: "🛢️", groupId: "other", keywords: ["o'simlik yog'i", "kungaboqar yog'i"] },
  { id: "tomat_pasta", label: "Tomat pasta", emoji: "🥫", groupId: "other", keywords: ["tomat past"] },
  { id: "shakar", label: "Shakar", emoji: "🍬", groupId: "other", keywords: ["shakar"] },
  { id: "asal", label: "Asal", emoji: "🍯", groupId: "other", keywords: ["asal"] },
  { id: "zira", label: "Zira", emoji: "🌿", groupId: "other", keywords: ["zira"] },
  { id: "qora_murch", label: "Qora murch", emoji: "🌶️", groupId: "other", keywords: ["qora murch"] },
  { id: "kunjut", label: "Kunjut", emoji: "⚪", groupId: "other", keywords: ["kunjut"] }
];
