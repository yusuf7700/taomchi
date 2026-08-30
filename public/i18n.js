// ===== Taomchi til tizimi (Lotin / Kirill) =====
// Yangi matn qo'shish uchun: HTML'da data-i18n="kalit" qo'ying,
// keyin shu kalitni ikkala tilga ham qo'shing.

const TRANSLATIONS = {
  uz: { // Lotin
    hero_title: "Bugun nima pishiramiz?",
    hero_subtitle: "Sizga mos taomni topamiz 👩‍🍳",
    search_placeholder: "Taom yoki mahsulot qidiring...",
    action_pantry: "Uyda nima bor?",
    action_ai: "AI'dan so'rash",
    action_weekly: "Haftalik menyu",
    today_recommend: "Bugungi tavsiya",
    recipe_osh: "Osh",
    minutes: "daqiqa",
    hours: "soat",
    time_unknown: "Noma'lum",
    categories: "Kategoriyalar",
    cat_main: "Asosiy taomlar",
    cat_soup: "Sho'rvalar",
    cat_salad: "Salatlar",
    cat_breakfast: "Nonushta",
    cat_dessert: "Shirinliklar",
    cat_pastry: "Yeguliklar",
    cat_drinks: "Ichimliklar",
    filter_all: "Hammasi",
    loading: "Yuklanmoqda...",
    recipe_detail_title: "Retsept",
    ingredients_title: "Kerakli mahsulotlar",
    steps_title: "Tayyorlash tartibi",
    premium_title: "Taomchi Premium",
    premium_subtitle: "Tez orada — AI, shaxsiy menyu va boshqa imkoniyatlar",
    settings_title: "Sozlamalar",
    language_label: "Til",
    notifications_label: "Bildirishnomalar",
    support_title: "Yordam",
    contact_us: "Biz bilan bog'lanish",
    app_version: "Taomchi v1.0",
    random_title: "Tasodifiy taom",
    random_subtitle: "Bugun nima pishirishni bilmayapsizmi? Biz tanlaymiz!",
    onboarding_title: "Taomchi'ga xush kelibsiz!",
    onboarding_subtitle: "Siz uchun 7 kunlik Premium sovg'a qilamiz. Barcha imkoniyatlarni sinab ko'ring.",
    onboarding_f1: "AI'dan so'rash — cheksiz savol-javob",
    onboarding_f2: "Haftalik menyu — AI yordamida",
    onboarding_f3: "Premium retseptlar",
    onboarding_start: "Premiumdan foydalanishni boshlash",
    onboarding_skip: "Keyinroq",
    see_all: "Barchasi ›",
    nav_home: "Bosh sahifa",
    nav_recipes: "Retseptlar",
    nav_favorites: "Saqlanganlar",
    nav_profile: "Profil",
    splash_tagline: "Har bir taom — yaqinlarga quvonch, yaxshiliklarga quvvat",
    pantry_intro: "Uyingizda bor mahsulotlarni tanlang, biz mos retseptlarni topamiz 👇",
    pantry_selected: "ta mahsulot tanlandi",
    pantry_clear: "Tozalash",
    pantry_empty_hint: "Retseptlarni ko'rish uchun uyingizdagi mahsulotlarni tanlang.",
    pantry_no_match: "Hozircha mos retsept topilmadi. Yana mahsulot tanlab ko'ring.",
    pantry_full_title: "✅ To'liq mos retseptlar",
    pantry_partial_title: "🔶 Deyarli tayyor",
    pantry_missing_suffix: "yetishmayapti",
    day_mon: "Dushanba",
    day_tue: "Seshanba",
    day_wed: "Chorshanba",
    day_thu: "Payshanba",
    day_fri: "Juma",
    day_sat: "Shanba",
    day_sun: "Yakshanba",
    weekly_intro: "Har bir kunga bitta taom belgilab qo'ying — hafta davomida nima pishirishni o'ylab yurmaysiz 👇",
    weekly_choose: "Retsept tanlash",
    weekly_no_results: "Hech narsa topilmadi",
    weekly_cancel: "Bekor qilish",
    search_placeholder_short: "Qidirish...",
    weekly_today: "Bugun",
    meal_lunch: "Tushlik",
    meal_dinner: "Kechki ovqat",
    day_short_mon: "Dush",
    day_short_tue: "Sesh",
    day_short_wed: "Chor",
    day_short_thu: "Pay",
    day_short_fri: "Jum",
    day_short_sat: "Shan",
    day_short_sun: "Yak"
  },
  uzk: { // Kirill
    hero_title: "Бугун нима пиширамиз?",
    hero_subtitle: "Сизга мос таомни топамиз 👩‍🍳",
    search_placeholder: "Таом ёки маҳсулот қидиринг...",
    action_pantry: "Уйда нима бор?",
    action_ai: "AI'дан сўраш",
    action_weekly: "Ҳафталик менюси",
    today_recommend: "Бугунги тавсия",
    recipe_osh: "Ош",
    minutes: "дақиқа",
    hours: "соат",
    time_unknown: "Номаълум",
    categories: "Категориялар",
    cat_main: "Асосий таомлар",
    cat_soup: "Шўрвалар",
    cat_salad: "Салатлар",
    cat_breakfast: "Нонушта",
    cat_dessert: "Ширинликлар",
    cat_pastry: "Егуликлар",
    cat_drinks: "Ичимликлар",
    filter_all: "Ҳаммаси",
    loading: "Юкланмоқда...",
    recipe_detail_title: "Рецепт",
    ingredients_title: "Керакли маҳсулотлар",
    steps_title: "Тайёрлаш тартиби",
    premium_title: "Taomchi Premium",
    premium_subtitle: "Тез орада — AI, шахсий меню ва бошқа имкониятлар",
    settings_title: "Созламалар",
    language_label: "Тил",
    notifications_label: "Билдиришномалар",
    support_title: "Ёрдам",
    contact_us: "Биз билан боғланиш",
    app_version: "Taomchi v1.0",
    random_title: "Тасодифий таом",
    random_subtitle: "Бугун нима пиширишни билмаяпсизми? Биз танлаймиз!",
    onboarding_title: "Taomchi'га хуш келибсиз!",
    onboarding_subtitle: "Сиз учун 7 кунлик Premium совға қиламиз. Барча имкониятларни синаб кўринг.",
    onboarding_f1: "AI'дан сўраш — чексиз савол-жавоб",
    onboarding_f2: "Ҳафталик меню — AI ёрдамида",
    onboarding_f3: "Premium рецептлар",
    onboarding_start: "Premium'дан фойдаланишни бошлаш",
    onboarding_skip: "Кейинроқ",
    see_all: "Ҳаммаси ›",
    nav_home: "Бош саҳифа",
    nav_recipes: "Рецептлар",
    nav_favorites: "Сақланганлар",
    nav_profile: "Профил",
    splash_tagline: "Ҳар бир таом — яқинларга қувонч, яхшиликларга қувват",
    pantry_intro: "Уйингизда бор маҳсулотларни танланг, биз мос рецептларни топамиз 👇",
    pantry_selected: "та маҳсулот танланди",
    pantry_clear: "Тозалаш",
    pantry_empty_hint: "Рецептларни кўриш учун уйингиздаги маҳсулотларни танланг.",
    pantry_no_match: "Ҳозирча мос рецепт топилмади. Яна маҳсулот танлаб кўринг.",
    pantry_full_title: "✅ Тўлиқ мос рецептлар",
    pantry_partial_title: "🔶 Деярли тайёр",
    pantry_missing_suffix: "етишмаяпти",
    day_mon: "Душанба",
    day_tue: "Сешанба",
    day_wed: "Чоршанба",
    day_thu: "Пайшанба",
    day_fri: "Жума",
    day_sat: "Шанба",
    day_sun: "Якшанба",
    weekly_intro: "Ҳар бир кунга битта таом белгилаб қўйинг — ҳафта давомида нима пиширишни ўйлаб юрмайсиз 👇",
    weekly_choose: "Рецепт танлаш",
    weekly_no_results: "Ҳеч нарса топилмади",
    weekly_cancel: "Бекор қилиш",
    search_placeholder_short: "Қидириш...",
    weekly_today: "Бугун",
    meal_lunch: "Тушлик",
    meal_dinner: "Кечки овқат",
    day_short_mon: "Душ",
    day_short_tue: "Сеш",
    day_short_wed: "Чор",
    day_short_thu: "Пай",
    day_short_fri: "Жум",
    day_short_sat: "Шан",
    day_short_sun: "Якш"
  }
};

const LANG_STORAGE_KEY = "taomchi_lang";

function getCurrentLang() {
  return localStorage.getItem(LANG_STORAGE_KEY) || "uz";
}

function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.setAttribute("placeholder", dict[key]);
  });

  const toggleBtn = document.getElementById("langToggle");
  if (toggleBtn) toggleBtn.textContent = lang === "uz" ? "UZ" : "ЎЗ";

  localStorage.setItem(LANG_STORAGE_KEY, lang);
  document.documentElement.setAttribute("lang", lang === "uz" ? "uz" : "uz-Cyrl");
}

function toggleLang() {
  const current = getCurrentLang();
  const next = current === "uz" ? "uzk" : "uz";
  applyTranslations(next);
}

// Sahifa ochilganda saqlangan tilni qo'llash
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations(getCurrentLang());
  const toggleBtn = document.getElementById("langToggle");
  if (toggleBtn) toggleBtn.addEventListener("click", toggleLang);
});

// ===== Tayyorlanish vaqtini formatlash (barcha sahifalarda ishlatiladi) =====
function formatCookTime(r) {
  const dict = TRANSLATIONS[getCurrentLang()] || TRANSLATIONS.uz;
  if (r.cookTimeUnit === "nomalum") return dict.time_unknown || "Noma'lum";
  if (r.cookTimeUnit === "soat") return `${r.cookTime || "-"} ${dict.hours || "soat"}`;
  return `${r.cookTime || "-"} ${dict.minutes}`;
}

// ===== Qiyinchilik darajasi belgisi (barcha sahifalarda ishlatiladi) =====
const DIFFICULTY_LABELS = {
  oson: "🟢 Oson",
  orta: "🟡 O'rta",
  qiyin: "🔴 Qiyin"
};

function difficultyBadge(r) {
  const label = DIFFICULTY_LABELS[r.difficulty];
  return label ? `<span>${label}</span>` : "";
}
