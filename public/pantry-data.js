// ===== Taomchi — "Uyda nima bor?" uchun asosiy mahsulotlar ro'yxati =====
// Har bir mahsulot uchun `keywords` — retseptlarning ingredient matnida
// qidiriladigan lotincha kalit so'z(lar). Kirillcha matn avtomatik lotinga
// o'giriladi (translit.js), shuning uchun keywords faqat lotincha yoziladi.

const PANTRY_GROUPS = [
  {
    id: "meat",
    label: "Go'sht, baliq va tuxum",
    items: [
      { id: "tovuq", label: "Tovuq go'shti", emoji: "🍗", keywords: ["tovuq"] },
      { id: "mol_goshti", label: "Mol go'shti", emoji: "🥩", keywords: ["mol go'shti", "sigir go'shti"] },
      { id: "qoy_goshti", label: "Qo'y go'shti", emoji: "🍖", keywords: ["qo'y go'shti", "qo'y go'sht"] },
      { id: "baliq", label: "Baliq", emoji: "🐟", keywords: ["baliq"] },
      { id: "tuxum", label: "Tuxum", emoji: "🥚", keywords: ["tuxum"] }
    ]
  },
  {
    id: "veg",
    label: "Sabzavotlar",
    items: [
      { id: "kartoshka", label: "Kartoshka", emoji: "🥔", keywords: ["kartoshka"] },
      { id: "sabzi", label: "Sabzi", emoji: "🥕", keywords: ["sabzi"] },
      { id: "piyoz", label: "Piyoz", emoji: "🧅", keywords: ["piyoz"] },
      { id: "kok_piyoz", label: "Ko'k piyoz", emoji: "🌱", keywords: ["ko'k piyoz"] },
      { id: "pomidor", label: "Pomidor", emoji: "🍅", keywords: ["pomidor"] },
      { id: "bodring", label: "Bodring", emoji: "🥒", keywords: ["bodring"] },
      { id: "qalampir", label: "Qalampir (bulg'or)", emoji: "🫑", keywords: ["qalampir", "bolgar qalampiri"] },
      { id: "achchiq_qalampir", label: "Achchiq qalampir", emoji: "🌶️", keywords: ["achchiq qalampir", "achchiq murch"] },
      { id: "baqlajon", label: "Baqlajon", emoji: "🍆", keywords: ["baqlajon"] },
      { id: "kabachka", label: "Kabachka", emoji: "🥒", keywords: ["kabachka"] },
      { id: "sarimsoq", label: "Sarimsoq piyoz", emoji: "🧄", keywords: ["sarimsoq"] },
      { id: "karam", label: "Karam", emoji: "🥬", keywords: ["karam"] },
      { id: "sholgom", label: "Sholg'om", emoji: "🥔", keywords: ["sholg'om"] }
    ]
  },
  {
    id: "herbs",
    label: "Ko'katlar",
    items: [
      { id: "kashnich", label: "Kashnich", emoji: "🌿", keywords: ["kashnich"] },
      { id: "ukrop", label: "Ukrop", emoji: "🌿", keywords: ["ukrop"] },
      { id: "rayhon", label: "Rayhon", emoji: "🌿", keywords: ["rayhon"] },
      { id: "yalpiz", label: "Yalpiz / Myata", emoji: "🌱", keywords: ["yalpiz", "myata"] },
      { id: "salat_barglari", label: "Salat barglari", emoji: "🥬", keywords: ["salat barg", "salat"] }
    ]
  },
  {
    id: "grains",
    label: "Don va yormalar",
    items: [
      { id: "guruch", label: "Guruch", emoji: "🍚", keywords: ["guruch"] },
      { id: "un", label: "Un", emoji: "🌾", keywords: ["un"] },
      { id: "makaron", label: "Makaron", emoji: "🍝", keywords: ["makaron"] },
      { id: "vermishel", label: "Vermishel", emoji: "🍜", keywords: ["vermishel"] },
      { id: "noxat", label: "No'xat", emoji: "🫘", keywords: ["no'xat"] },
      { id: "loviya", label: "Loviya", emoji: "🫘", keywords: ["loviya"] },
      { id: "mosh", label: "Mosh", emoji: "🫘", keywords: ["mosh"] },
      { id: "non", label: "Non", emoji: "🍞", keywords: ["non"] }
    ]
  },
  {
    id: "dairy",
    label: "Sut mahsulotlari",
    items: [
      { id: "sut", label: "Sut", emoji: "🥛", keywords: ["sut"] },
      { id: "qatiq", label: "Qatiq", emoji: "🥛", keywords: ["qatiq"] },
      { id: "tvorog", label: "Tvorog", emoji: "🧀", keywords: ["tvorog", "tvarog", "tvarojniy"] },
      { id: "smetana", label: "Smetana", emoji: "🥄", keywords: ["smetana"] },
      { id: "sir", label: "Sir (pishloq)", emoji: "🧀", keywords: ["sir", "pishloq"] },
      { id: "sariyog", label: "Sariyog'", emoji: "🧈", keywords: ["sariyog'"] },
      { id: "margarin", label: "Margarin", emoji: "🧈", keywords: ["margarin"] }
    ]
  },
  {
    id: "fruit",
    label: "Mevalar",
    items: [
      { id: "limon", label: "Limon", emoji: "🍋", keywords: ["limon"] },
      { id: "olma", label: "Olma", emoji: "🍎", keywords: ["olma"] },
      { id: "uzum", label: "Uzum", emoji: "🍇", keywords: ["uzum"] },
      { id: "banan", label: "Banan", emoji: "🍌", keywords: ["banan"] },
      { id: "behi", label: "Behi", emoji: "🍐", keywords: ["behi"] },
      { id: "anor", label: "Anor", emoji: "🍎", keywords: ["anor"] },
      { id: "qulupnay", label: "Qulupnay", emoji: "🍓", keywords: ["qulupnay"] },
      { id: "shaftoli", label: "Shaftoli", emoji: "🍑", keywords: ["shaftoli"] }
    ]
  },
  {
    id: "dessert",
    label: "Shirinlik mahsulotlari",
    items: [
      { id: "qaymoq", label: "Qaymoq", emoji: "🍦", keywords: ["qaymoq"] },
      { id: "sgushonka", label: "Sgushonka", emoji: "🥫", keywords: ["sgushonka", "quyuq sut"] },
      { id: "shokolad", label: "Shokolad", emoji: "🍫", keywords: ["shokolad"] },
      { id: "pechenye", label: "Pechenye", emoji: "🍪", keywords: ["pechenye", "pecheniye"] },
      { id: "vanilin", label: "Vanilin", emoji: "🌼", keywords: ["vanilin", "vanil"] },
      { id: "kokos", label: "Kokos qirindisi", emoji: "🥥", keywords: ["kokos"] },
      { id: "jem", label: "Jem / murabbo", emoji: "🍓", keywords: ["jem", "murabbo", "povidlo"] },
      { id: "razrixlitel", label: "Razrixlitel (xamir kukuni)", emoji: "🧁", keywords: ["razrixlitel"] }
    ]
  },
  {
    id: "other",
    label: "Boshqa mahsulotlar",
    items: [
      { id: "osimlik_yogi", label: "O'simlik yog'i", emoji: "🛢️", keywords: ["o'simlik yog'i", "kungaboqar yog'i"] },
      { id: "tomat_pasta", label: "Tomat pasta", emoji: "🥫", keywords: ["tomat past"] },
      { id: "shakar", label: "Shakar", emoji: "🍬", keywords: ["shakar"] },
      { id: "asal", label: "Asal", emoji: "🍯", keywords: ["asal"] },
      { id: "tuz", label: "Tuz", emoji: "🧂", keywords: ["tuz"] },
      { id: "limon_tuzi", label: "Limon tuzi", emoji: "🍋", keywords: ["limon tuzi"] },
      { id: "zira", label: "Zira", emoji: "🌿", keywords: ["zira"] },
      { id: "qora_murch", label: "Qora murch", emoji: "🌶️", keywords: ["qora murch"] },
      { id: "kunjut", label: "Kunjut", emoji: "⚪", keywords: ["kunjut"] },
      { id: "choy", label: "Choy", emoji: "🍵", keywords: ["choy"] }
    ]
  }
];

// Barcha mahsulotlarning tekis (flat) ro'yxati — qidiruv/solishtirish uchun qulay
const PANTRY_INGREDIENTS = PANTRY_GROUPS.flatMap(g => g.items);
