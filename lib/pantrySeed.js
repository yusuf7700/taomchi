// ===== Taomchi — "Uyda nima bor?" boshlang'ich mahsulotlar va seed logikasi =====
// Bu fayl api/admin-pantry.js va api/admin-recipes.js ikkalasida ham
// ishlatiladi — chunki mahsulotlar ro'yxati hali "seed" qilinmagan bo'lsa,
// retsept saqlashda ham, taklif ro'yxatini ochishda ham avval shu bajarilishi kerak
// (aks holda hamma so'z "yangi" deb noto'g'ri belgilanib qoladi).

const SEED_INGREDIENTS = [
  { id: "tovuq", label: "Tovuq go'shti", emoji: "🍗", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["tovuq"] },
  { id: "mol_goshti", label: "Mol go'shti", emoji: "🥩", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["mol go'shti", "sigir go'shti"] },
  { id: "qoy_goshti", label: "Qo'y go'shti", emoji: "🍖", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["qo'y go'shti", "qo'y go'sht"] },
  { id: "baliq", label: "Baliq", emoji: "🐟", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["baliq"] },
  { id: "tuxum", label: "Tuxum", emoji: "🥚", groupId: "meat", groupLabel: "Go'sht, baliq va tuxum", keywords: ["tuxum"] },

  { id: "kartoshka", label: "Kartoshka", emoji: "🥔", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["kartoshka"] },
  { id: "sabzi", label: "Sabzi", emoji: "🥕", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["sabzi"] },
  { id: "piyoz", label: "Piyoz", emoji: "🧅", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["piyoz"] },
  { id: "kok_piyoz", label: "Ko'k piyoz", emoji: "🌱", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["ko'k piyoz"] },
  { id: "pomidor", label: "Pomidor", emoji: "🍅", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["pomidor"] },
  { id: "bodring", label: "Bodring", emoji: "🥒", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["bodring"] },
  { id: "qalampir", label: "Qalampir (bulg'or)", emoji: "🫑", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["qalampir", "bolgar qalampiri"] },
  { id: "baqlajon", label: "Baqlajon", emoji: "🍆", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["baqlajon"] },
  { id: "kabachka", label: "Kabachka", emoji: "🥒", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["kabachka"] },
  { id: "sarimsoq", label: "Sarimsoq piyoz", emoji: "🧄", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["sarimsoq"] },
  { id: "karam", label: "Karam", emoji: "🥬", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["karam"] },
  { id: "sholgom", label: "Sholg'om", emoji: "🥔", groupId: "veg", groupLabel: "Sabzavotlar", keywords: ["sholg'om"] },

  { id: "kashnich", label: "Kashnich", emoji: "🌿", groupId: "herbs", groupLabel: "Ko'katlar", keywords: ["kashnich"] },
  { id: "ukrop", label: "Ukrop", emoji: "🌿", groupId: "herbs", groupLabel: "Ko'katlar", keywords: ["ukrop"] },
  { id: "rayhon", label: "Rayhon", emoji: "🌿", groupId: "herbs", groupLabel: "Ko'katlar", keywords: ["rayhon"] },
  { id: "salat_barglari", label: "Salat barglari", emoji: "🥬", groupId: "herbs", groupLabel: "Ko'katlar", keywords: ["salat barg", "salat"] },

  { id: "guruch", label: "Guruch", emoji: "🍚", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["guruch"] },
  { id: "un", label: "Un", emoji: "🌾", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["un"] },
  { id: "makaron", label: "Makaron", emoji: "🍝", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["makaron"] },
  { id: "noxat", label: "No'xat", emoji: "🫘", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["no'xat"] },
  { id: "loviya", label: "Loviya", emoji: "🫘", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["loviya"] },
  { id: "mosh", label: "Mosh", emoji: "🫘", groupId: "grains", groupLabel: "Don va yormalar", keywords: ["mosh"] },

  { id: "sut", label: "Sut", emoji: "🥛", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["sut"] },
  { id: "qatiq", label: "Qatiq", emoji: "🥛", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["qatiq"] },
  { id: "tvorog", label: "Tvorog", emoji: "🧀", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["tvorog", "tvarog", "tvarojniy"] },
  { id: "smetana", label: "Smetana", emoji: "🥄", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["smetana"] },
  { id: "sir", label: "Sir (pishloq)", emoji: "🧀", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["sir", "pishloq"] },
  { id: "sariyog", label: "Sariyog'", emoji: "🧈", groupId: "dairy", groupLabel: "Sut mahsulotlari", keywords: ["sariyog'"] },

  { id: "limon", label: "Limon", emoji: "🍋", groupId: "fruit", groupLabel: "Mevalar", keywords: ["limon"] },
  { id: "olma", label: "Olma", emoji: "🍎", groupId: "fruit", groupLabel: "Mevalar", keywords: ["olma"] },
  { id: "uzum", label: "Uzum", emoji: "🍇", groupId: "fruit", groupLabel: "Mevalar", keywords: ["uzum"] },
  { id: "banan", label: "Banan", emoji: "🍌", groupId: "fruit", groupLabel: "Mevalar", keywords: ["banan"] },

  { id: "osimlik_yogi", label: "O'simlik yog'i", emoji: "🛢️", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["o'simlik yog'i", "kungaboqar yog'i"] },
  { id: "tomat_pasta", label: "Tomat pasta", emoji: "🥫", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["tomat past"] },
  { id: "shakar", label: "Shakar", emoji: "🍬", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["shakar"] },
  { id: "asal", label: "Asal", emoji: "🍯", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["asal"] },
  { id: "zira", label: "Zira", emoji: "🌿", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["zira"] },
  { id: "qora_murch", label: "Qora murch", emoji: "🌶️", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["qora murch"] },
  { id: "kunjut", label: "Kunjut", emoji: "⚪", groupId: "other", groupLabel: "Boshqa mahsulotlar", keywords: ["kunjut"] },

  { id: "qaymoq", label: "Qaymoq", emoji: "🍦", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["qaymoq"] },
  { id: "sgushonka", label: "Sgushonka", emoji: "🥫", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["sgushonka", "quyuq sut"] },
  { id: "shokolad", label: "Shokolad", emoji: "🍫", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["shokolad"] },
  { id: "pechenye", label: "Pechenye", emoji: "🍪", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["pechenye", "pecheniye"] },
  { id: "vanilin", label: "Vanilin", emoji: "🌼", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["vanilin", "vanil"] },
  { id: "kokos", label: "Kokos qirindisi", emoji: "🥥", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["kokos"] },
  { id: "jem", label: "Jem / murabbo", emoji: "🍓", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["jem", "murabbo", "povidlo"] },
  { id: "razrixlitel", label: "Razrixlitel (xamir kukuni)", emoji: "🧁", groupId: "dessert", groupLabel: "Shirinlik mahsulotlari", keywords: ["razrixlitel"] }
];

async function ensureSeeded(db) {
  const snap = await db.collection("pantryIngredients").limit(1).get();
  if (!snap.empty) return;

  const batch = db.batch();
  for (const item of SEED_INGREDIENTS) {
    const { id, ...data } = item;
    batch.set(db.collection("pantryIngredients").doc(id), data);
  }
  await batch.commit();
}

module.exports = { SEED_INGREDIENTS, ensureSeeded };
