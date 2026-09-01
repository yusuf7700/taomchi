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
    premium_active_title: "⭐ Premium faol",
    premium_days_left_suffix: " kun qoldi",
    premium_gift_title: "🎁 Sizga sovg'a bor!",
    premium_gift_subtitle_suffix: " kunlik Premium — bepul sinab ko'ring",
    premium_buy_subtitle_prefix: "Oyiga ⭐",
    premium_buy_subtitle_suffix: " — AI so'rovlar + premium retseptlar",
    premium_trial_confirm_suffix: " kunlik Premium sovg'angizni faollashtirasizmi?",
    premium_buy_confirm_text: "👑 Premium bilan kuniga 15 marta AI'dan so'rashingiz mumkin. Muddatni tanlang:",
    premium_cancel_btn: "Bekor qilish",
    premium_use_btn: "Ishlatish",
    premium_monthly_btn: "Oylik",
    premium_yearly_btn: "Yillik",
    premium_error: "Xatolik yuz berdi, birozdan keyin qayta urinib ko'ring.",
    premium_feature_ai: "Kuniga 15 marta AI'dan so'rash",
    premium_feature_recipes: "Premium retseptlarga to'liq kirish",
    premium_feature_future: "Kelajakdagi yangi imkoniyatlar birinchilardan",
    premium_per_month: "oy",
    premium_per_year: "yil",
    premium_save: "tejash",
    premium_buy_cta: "Sotib olish",
    recipe_lock_title: "Bu — Premium retsept",
    recipe_lock_text: "To'liq tarkib, tayyorlash tartibi va videoni ko'rish uchun Premium'ga obuna bo'ling.",
    recipe_lock_btn: "👑 Premium olish",
    referral_title: "Do'stlarni taklif qiling",
    referral_subtitle: "Har bir taklif — 1 ball. 3 ball = 1ta Premium retsept bepul!",
    referral_points_label: "Sizning ballaringiz",
    referral_share_btn: "📤 Ulashish",
    referral_copy_btn: "🔗 Nusxalash",
    referral_share_text: "Taomchi — ovqat retseptlari va AI yordamchi bilan! Menga qo'shiling 👇",
    referral_copied: "Havola nusxalandi!",
    recipe_redeem_btn_prefix: "🎁 ",
    recipe_redeem_btn_suffix: " ball evaziga ochish",
    recipe_redeem_hint_prefix: "Ballaringiz: ",
    recipe_redeem_hint_suffix: " — do'st taklif qilib ball to'plang!",
    referral_shop_title: "🛍 Ballar do'koni",
    referral_ball_word: "ball",
    referral_shop_ai_title: "+1 qo'shimcha AI so'rov",
    referral_shop_premium3d_title: "3 kunlik Premium",
    referral_shop_premium30d_title: "1 oylik Premium",
    referral_shop_buy_btn: "Olish",
    referral_shop_not_enough: "Ballaringiz yetarli emas.",
    referral_shop_success: "Muvaffaqiyatli olindi! 🎉",
    referral_shop_error: "Xatolik yuz berdi, birozdan keyin qayta urinib ko'ring.",
    settings_title: "Sozlamalar",
    language_label: "Til",
    notifications_label: "Bildirishnomalar",
    support_title: "Yordam",
    contact_us: "Biz bilan bog'lanish",
    app_version: "Taomchi v1.0",
    random_title: "Tasodifiy taom",
    random_subtitle: "Bugun nima pishirishni bilmayapsizmi? Biz tanlaymiz!",
    onboarding_title: "Taomchi'ga xush kelibsiz!",
    onboarding_subtitle: "Siz uchun 3 kunlik Premium sovg'a bor. Sozlamalar bo'limida oling va barcha imkoniyatlarni sinab ko'ring.",
    onboarding_f1: "AI'dan so'rash — kuniga bir necha marta",
    onboarding_f2: "Haftalik menyu — AI yordamida",
    onboarding_f3: "Premium retseptlar",
    onboarding_start: "Sozlamalarga o'tish",
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
    day_short_sun: "Yak",
    ai_intro: "Uyingizda bor mahsulotlar yoki ovqat pishirish haqida savolingiz bo'lsa, so'rang 👇",
    ai_placeholder: "Masalan: Tuxum va pomidor bilan nima pishirsam bo'ladi?",
    ai_ask_btn: "So'rash",
    ai_thinking: "O'ylanmoqda...",
    ai_limit_reached: "Bugungi bepul so'rov limiti tugadi. Ertaga qayta urinib ko'ring yoki Premium bilan kuniga 15 marta so'rang.",
    ai_limit_reached_short: "Bugungi limit tugadi",
    ai_telegram_only: "Bu funksiya faqat Telegram ilovasi ichida ishlaydi.",
    ai_premium_unlimited: "Premium: kuniga 15 marta so'rov",
    ai_free_remaining: "Bugun yana so'rash mumkin: ",
    ai_pay_once_more: "yana 1 marta so'rash",
    ai_loading: "Yuklanmoqda...",
    stars_buy_prompt: "Stars yetarli emasmi? Tez va oson sotib oling 👇",
    stars_buy_btn: "⭐ Stars sotib olish",
    ai_greeting_1: "Assalomu alaykum! 👋 Men Taomchi — sizning oshxonadagi yordamchingizman. Uyda nima bor, nima pishirsam bo'ladi — bemalol so'rang! 🍲",
    ai_greeting_2: "Salom-salom! 😊 Bugun nima pishiramiz? Qo'lingizda bor mahsulotlarni ayting, birga o'ylaymiz 👨‍🍳",
    ai_greeting_3: "Xush kelibsiz! 🥘 Ovqat, retsept yoki pishirish bo'yicha savolingiz bo'lsa — men shu yerdaman."
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
    premium_active_title: "⭐ Premium фаол",
    premium_days_left_suffix: " кун қолди",
    premium_gift_title: "🎁 Сизга совға бор!",
    premium_gift_subtitle_suffix: " кунлик Premium — бепул синаб кўринг",
    premium_buy_subtitle_prefix: "Ойига ⭐",
    premium_buy_subtitle_suffix: " — AI сўровлар + premium рецептлар",
    premium_trial_confirm_suffix: " кунлик Premium совғангизни фаоллаштирасизми?",
    premium_buy_confirm_text: "👑 Premium билан кунига 15 марта AI'дан сўрашингиз мумкин. Муддатни танланг:",
    premium_cancel_btn: "Бекор қилиш",
    premium_use_btn: "Ишлатиш",
    premium_monthly_btn: "Ойлик",
    premium_yearly_btn: "Йиллик",
    premium_error: "Хатолик юз берди, бирозда кейин қайта уриниб кўринг.",
    premium_feature_ai: "Кунига 15 марта AI'дан сўраш",
    premium_feature_recipes: "Premium рецептларга тўлиқ кириш",
    premium_feature_future: "Келажакдаги янги имкониятлар биринчилардан",
    premium_per_month: "ой",
    premium_per_year: "йил",
    premium_save: "тежаш",
    premium_buy_cta: "Сотиб олиш",
    recipe_lock_title: "Бу — Premium рецепт",
    recipe_lock_text: "Тўлиқ таркиб, тайёрлаш тартиби ва видеони кўриш учун Premium'га обуна бўлинг.",
    recipe_lock_btn: "👑 Premium олиш",
    referral_title: "Дўстларни таклиф қилинг",
    referral_subtitle: "Ҳар бир таклиф — 1 балл. 3 балл = 1та Premium рецепт бепул!",
    referral_points_label: "Сизнинг баллларингиз",
    referral_share_btn: "📤 Улашиш",
    referral_copy_btn: "🔗 Нусхалаш",
    referral_share_text: "Taomchi — овқат рецептлари ва AI ёрдамчи билан! Менга қўшилинг 👇",
    referral_copied: "Ҳавола нусхаланди!",
    recipe_redeem_btn_prefix: "🎁 ",
    recipe_redeem_btn_suffix: " балл эвазига очиш",
    recipe_redeem_hint_prefix: "Баллларингиз: ",
    recipe_redeem_hint_suffix: " — дўст таклиф қилиб балл тўпланг!",
    referral_shop_title: "🛍 Баллар дўкони",
    referral_ball_word: "балл",
    referral_shop_ai_title: "+1 қўшимча AI сўров",
    referral_shop_premium3d_title: "3 кунлик Premium",
    referral_shop_premium30d_title: "1 ойлик Premium",
    referral_shop_buy_btn: "Олиш",
    referral_shop_not_enough: "Баллларингиз етарли эмас.",
    referral_shop_success: "Муваффақиятли олинди! 🎉",
    referral_shop_error: "Хатолик юз берди, бироздан кейин қайта уриниб кўринг.",
    settings_title: "Созламалар",
    language_label: "Тил",
    notifications_label: "Билдиришномалар",
    support_title: "Ёрдам",
    contact_us: "Биз билан боғланиш",
    app_version: "Taomchi v1.0",
    random_title: "Тасодифий таом",
    random_subtitle: "Бугун нима пиширишни билмаяпсизми? Биз танлаймиз!",
    onboarding_title: "Taomchi'га хуш келибсиз!",
    onboarding_subtitle: "Сиз учун 3 кунлик Premium совға бор. Созламалар бўлимида олинг ва барча имкониятларни синаб кўринг.",
    onboarding_f1: "AI'дан сўраш — кунига бир неча марта",
    onboarding_f2: "Ҳафталик меню — AI ёрдамида",
    onboarding_f3: "Premium рецептлар",
    onboarding_start: "Созламаларга ўтиш",
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
    day_short_sun: "Якш",
    ai_intro: "Уйингизда бор маҳсулотлар ёки овқат пишириш ҳақида саволингиз бўлса, сўранг 👇",
    ai_placeholder: "Масалан: Тухум ва помидор билан нима пиширсам бўлади?",
    ai_ask_btn: "Сўраш",
    ai_thinking: "Ўйланмоқда...",
    ai_limit_reached: "Бугунги бепул сўров лимити тугади. Эртага қайта уриниб кўринг ёки Premium билан кунига 15 марта сўранг.",
    ai_limit_reached_short: "Бугунги лимит тугади",
    ai_telegram_only: "Бу функция фақат Telegram иловаси ичида ишлайди.",
    ai_premium_unlimited: "Premium: кунига 15 марта сўров",
    ai_free_remaining: "Бугун яна сўраш мумкин: ",
    ai_pay_once_more: "яна 1 марта сўраш",
    ai_loading: "Юкланмоқда...",
    stars_buy_prompt: "Stars етарли эмасми? Тез ва осон сотиб олинг 👇",
    stars_buy_btn: "⭐ Stars сотиб олиш",
    ai_greeting_1: "Ассалому алайкум! 👋 Мен Taomchi — сизнинг ошхонадаги ёрдамчингизман. Уйда нима бор, нима пиширсам бўлади — бемалол сўранг! 🍲",
    ai_greeting_2: "Салом-салом! 😊 Бугун нима пиширамиз? Қўлингизда бор маҳсулотларни айтинг, бирга ўйлаймиз 👨‍🍳",
    ai_greeting_3: "Хуш келибсиз! 🥘 Овқат, рецепт ёки пишириш бўйича саволингиз бўлса — мен шу ердаман."
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

// ===== Premium retsept nishoni (barcha ro'yxatlarda ishlatiladi) =====
function premiumRibbon(r) {
  return r.isPremium ? `<span class="premium-ribbon">⭐ Premium</span>` : "";
}
