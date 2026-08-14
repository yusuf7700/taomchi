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
    nav_home: "Bosh sahifa",
    nav_recipes: "Retseptlar",
    nav_favorites: "Saqlanganlar",
    nav_profile: "Profil",
    splash_tagline: "Har bir taom — yaqinlarga quvonch, yaxshiliklarga quvvat"
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
    nav_home: "Бош саҳифа",
    nav_recipes: "Рецептлар",
    nav_favorites: "Сақланганлар",
    nav_profile: "Профил",
    splash_tagline: "Ҳар бир таом — яқинларга қувонч, яхшиликларга қувват"
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
