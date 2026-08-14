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
      minutes: "daqiqa",
      categories: "Kategoriyalar",
      cat_main: "Asosiy taomlar",
      cat_soup: "Sho'rvalar",
      cat_salad: "Salatlar",
      cat_breakfast: "Nonushta",
      cat_dessert: "Shirinliklar",
      cat_pastry: "Yeguliklar",
      cat_national: "Milliy taomlar",
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
      minutes: "дақиқа",
      categories: "Категориялар",
      cat_main: "Асосий таомлар",
      cat_soup: "Шўрвалар",
      cat_salad: "Салатлар",
      cat_breakfast: "Нонушта",
      cat_dessert: "Ширинликлар",
      cat_pastry: "Егуликлар",
      cat_national: "Миллий таомлар",
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