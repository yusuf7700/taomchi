// ===== Taomchi — Telegram bot =====

const { Telegraf } = require("telegraf");
const { getDb } = require("../lib/firebaseAdmin");
const { checkAndConsumeAiQuota, grantBonusQuestion, askFoodAssistant, EXTRA_QUESTION_STARS_PRICE } = require("../lib/aiAssistant");
const { activatePremiumSubscription, claimPremiumTrial, getPremiumStatus, MONTHLY_STARS_PRICE, YEARLY_STARS_PRICE } = require("../lib/premium");
const { creditReferral, getReferralStatus, redeemAiBonus, redeemPremiumDays, AI_BONUS_COST, PREMIUM_3D_COST, PREMIUM_3D_DAYS, PREMIUM_30D_COST, PREMIUM_30D_DAYS } = require("../lib/referral");
const { getActiveChannels } = require("../lib/requiredChannels");

const ADMIN_CHAT_ID = "7603550866";

const bot = new Telegraf(process.env.BOT_TOKEN);

const STARS_BOT_URL = "https://t.me/milliystar_bot?start=ref_7603550866";

let cachedBotUsername = null;
async function getBotUsername() {
  if (cachedBotUsername) return cachedBotUsername;
  const me = await bot.telegram.getMe();
  cachedBotUsername = me.username;
  return cachedBotUsername;
}

// ===== Majburiy obuna (force-subscribe) =====
// Kanallar ro'yxatini har safar Firestore'dan o'qimaslik uchun qisqa
// muddatga (60s) keshlanadi.
let channelsCache = { data: [], fetchedAt: 0 };
const CHANNELS_CACHE_TTL = 60 * 1000;

async function getCachedActiveChannels(db) {
  const now = Date.now();
  if (now - channelsCache.fetchedAt < CHANNELS_CACHE_TTL) return channelsCache.data;
  const data = await getActiveChannels(db);
  channelsCache = { data, fetchedAt: now };
  return data;
}

// Foydalanuvchi obuna bo'lmagan kanallar ro'yxatini qaytaradi.
async function getMissingChannels(ctx, channels) {
  const missing = [];
  for (const ch of channels) {
    try {
      const member = await ctx.telegram.getChatMember(ch.channelId, ctx.from.id);
      if (!["member", "administrator", "creator"].includes(member.status)) {
        missing.push(ch);
      }
    } catch {
      // Bot kanalda admin bo'lmasa yoki kanal topilmasa — xavfsizlik uchun
      // obuna bo'lmagan deb hisoblaymiz.
      missing.push(ch);
    }
  }
  return missing;
}

async function sendSubscriptionRequired(ctx, lang, missingChannels) {
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  const channelButtons = missingChannels.map((ch) => ([{
    text: `📡 ${ch.title || ch.channelId}`,
    url: `https://t.me/${ch.channelId.replace("@", "")}`
  }]));

  await ctx.reply(t.subscribeRequired, {
    reply_markup: {
      inline_keyboard: [...channelButtons, [{ text: t.subscribeCheckBtn, callback_data: "check_subscription" }]]
    }
  });
}

// ===== Bot matnlari (Lotin / Kirill) =====
const BOT_TEXT = {
  uz: {
    welcome: "Assalomu alaykum! Taomchi'ga xush kelibsiz 🍲\n\n\"Bugun nima pishiraman?\" degan savolga endi hech qachon o'ylanib qolmaysiz.\n\nQuyidagi tugmalardan foydalaning, yoki to'liq ilovani oching:",
    openApp: "🍲 Taomchini ochish",
    quickCommands: "Tezkor buyruqlar:\n🍽️ Tasodifiy taom — pastdagi tugma\n🧺 Uyda nima bor? — pastdagi tugma\n🗓 Haftalik menyu — pastdagi tugma\n🤖 AI'dan so'rash — pastdagi tugma\n⭐ Premium — pastdagi tugma\n🎁 Do'stlarni taklif qilish — pastdagi tugma\n🍲 Taom qidirish — /qidir osh (masalan)\n🌐 Tilni almashtirish — /til",
    randomBtnLabel: "🍽️ Tasodifiy taom",
    pantryBtnLabel: "🧺 Uyda nima bor?",
    weeklyBtnLabel: "🗓 Haftalik menyu",
    aiBtnLabel: "🤖 AI'dan so'rash",
    premiumBtnLabel: "⭐ Premium",
    referralBtnLabel: "🎁 Do'stlarni taklif qilish",
    aiPrompt: "Ovqat yoki oshxona haqidagi savolingizni yozib yuboring 👇\n(masalan: \"Tuxum va pomidor bilan nima pishirsam bo'ladi?\")",
    aiThinking: "🤔 O'ylanmoqda...",
    aiLimitReached: "⏳ Bugungi bepul so'rov limiti tugadi. Yana 1 marta so'rash uchun pastdagi tugmani bosing, yoki ertaga qayta urinib ko'ring.",
    aiError: "Kechirasiz, AI javob berishda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.",
    aiPayBtn: `⭐ ${EXTRA_QUESTION_STARS_PRICE} Stars — yana 1 marta so'rash`,
    aiInvoiceTitle: "Qo'shimcha AI so'rovi",
    aiInvoiceDescription: "1 marta qo'shimcha AI'dan savol so'rash huquqi",
    aiPaymentThanks: "✅ To'lov qabul qilindi! Javobingiz tayyorlanmoqda...",
    premiumPaymentThanks: "✅ To'lov qabul qilindi! Taomchi Premium faollashtirildi 🎉",
    premiumActiveStatus: (days) => `⭐ Premium faol — yana ${days} kun qoldi.`,
    premiumGiftPrompt: (days) => `🎁 Sizga sovg'a bor! ${days} kunlik Premium'ni bepul sinab ko'ring.`,
    premiumBuyPrompt: "👑 Premium bilan kuniga 15 marta AI'dan so'rashingiz mumkin. Muddatni tanlang:",
    premiumTrialBtn: (days) => `🎁 ${days} kunlik sovg'ani ishlatish`,
    premiumMonthlyBtn: (price) => `Oylik — ⭐${price}`,
    premiumYearlyBtn: (price) => `Yillik — ⭐${price}`,
    premiumTrialClaimed: "🎉 3 kunlik Premium faollashtirildi! Endi kuniga 15 marta AI'dan so'rashingiz mumkin.",
    premiumTrialAlreadyUsed: "Siz sovg'ani allaqachon ishlatgansiz.",
    premiumInvoiceMonthlyTitle: "Taomchi Premium — 1 oy",
    premiumInvoiceYearlyTitle: "Taomchi Premium — 1 yil",
    premiumInvoiceDescription: "Kuniga 15 marta AI'dan so'rash va boshqa Premium imkoniyatlar",
    starsBuyPrompt: "⭐ Stars yetarli emasmi? Tez va oson sotib oling:",
    starsBuyBtn: "⭐ Stars sotib olish",
    referralIntro: (points, link) => `🎁 Do'stlaringizni Taomchi'ga taklif qiling!\n\nHar bir yangi do'st — 1 ball. 3 ball to'plasangiz, xohlagan bitta Premium retseptni bepul ochasiz.\n\n⭐ Sizning ballaringiz: ${points}\n\n🔗 Havolangiz:\n${link}`,
    referralShareBtn: "📤 Ulashish",
    referralShareText: "Taomchi — ovqat retseptlari va AI yordamchi bilan! Menga qo'shiling 👇",
    referralShopAiBtn: "🤖 2 ball — +1 AI so'rov",
    referralShopPremium3dBtn: "⭐ 8 ball — 3 kunlik Premium",
    referralShopPremium30dBtn: "👑 20 ball — 1 oylik Premium",
    referralShopSuccess: "Muvaffaqiyatli olindi! 🎉",
    referralShopNotEnough: "Ballaringiz yetarli emas.",
    subscribeRequired: "🔒 Botdan foydalanish uchun quyidagi kanal(lar)ga obuna bo'ling, so'ng \"Tekshirish\" tugmasini bosing:",
    subscribeCheckBtn: "✅ Tekshirish",
    subscribeSuccess: "✅ Obuna tasdiqlandi! Botdan foydalanishingiz mumkin.",
    subscribeStillMissing: "❌ Siz hali barcha kanallarga obuna bo'lmagansiz.",
    viewRecipe: "📖 Retseptni ko'rish",
    viewShort: "📖 Ko'rish",
    noRecipes: "Hozircha retseptlar mavjud emas.",
    errorMsg: "Xatolik yuz berdi, birozdan keyin qayta urinib ko'ring.",
    searchUsage: "Qidirish uchun shunday yozing: /qidir osh",
    noMatches: (q) => `"${q}" bo'yicha hech narsa topilmadi.`,
    minutes: "daqiqa",
    hours: "soat",
    timeUnknown: "Noma'lum",
    difficulty: { oson: "🟢 Oson", orta: "🟡 O'rta", qiyin: "🔴 Qiyin" }
  },
  uzk: {
    welcome: "Ассалому алайкум! Taomchi'га хуш келибсиз 🍲\n\n\"Бугун нима пиширaман?\" деган саволга энди ҳеч қачон ўйланиб қолмайсиз.\n\nҚуйидаги тугмалардан фойдаланинг, ёки тўлиқ иловани очинг:",
    openApp: "🍲 Taomchini очиш",
    quickCommands: "Тезкор буйруқлар:\n🍽️ Тасодифий таом — пастдаги тугма\n🧺 Уйда нима бор? — пастдаги тугма\n🗓 Ҳафталик менюси — пастдаги тугма\n🤖 AI'дан сўраш — пастдаги тугма\n⭐ Premium — пастдаги тугма\n🎁 Дўстларни таклиф қилиш — пастдаги тугма\n🍲 Таом қидириш — /qidir ош (масалан)\n🌐 Тилни алмаштириш — /til",
    randomBtnLabel: "🍽️ Тасодифий таом",
    pantryBtnLabel: "🧺 Уйда нима бор?",
    weeklyBtnLabel: "🗓 Ҳафталик менюси",
    aiBtnLabel: "🤖 AI'дан сўраш",
    premiumBtnLabel: "⭐ Premium",
    referralBtnLabel: "🎁 Дўстларни таклиф қилиш",
    aiPrompt: "Овқат ёки ошхона ҳақидаги саволингизни ёзиб юборинг 👇\n(масалан: \"Тухум ва помидор билан нима пиширсам бўлади?\")",
    aiThinking: "🤔 Ўйланмоқда...",
    aiLimitReached: "⏳ Бугунги бепул сўров лимити тугади. Яна 1 марта сўраш учун пастдаги тугмани босинг, ёки эртага қайта уриниб кўринг.",
    aiError: "Кечирасиз, AI жавоб беришда хатолик юз берди. Бироздан кейин қайта уриниб кўринг.",
    aiPayBtn: `⭐ ${EXTRA_QUESTION_STARS_PRICE} Stars — яна 1 марта сўраш`,
    aiInvoiceTitle: "Қўшимча AI сўрови",
    aiInvoiceDescription: "1 марта қўшимча AI'дан савол сўраш ҳуқуқи",
    aiPaymentThanks: "✅ Тўлов қабул қилинди! Жавобингиз тайёрланмоқда...",
    premiumPaymentThanks: "✅ Тўлов қабул қилинди! Taomchi Premium фаоллаштирилди 🎉",
    premiumActiveStatus: (days) => `⭐ Premium фаол — яна ${days} кун қолди.`,
    premiumGiftPrompt: (days) => `🎁 Сизга совға бор! ${days} кунлик Premium'ни бепул синаб кўринг.`,
    premiumBuyPrompt: "👑 Premium билан кунига 15 марта AI'дан сўрашингиз мумкин. Муддатни танланг:",
    premiumTrialBtn: (days) => `🎁 ${days} кунлик совғани ишлатиш`,
    premiumMonthlyBtn: (price) => `Ойлик — ⭐${price}`,
    premiumYearlyBtn: (price) => `Йиллик — ⭐${price}`,
    premiumTrialClaimed: "🎉 3 кунлик Premium фаоллаштирилди! Энди кунига 15 марта AI'дан сўрашингиз мумкин.",
    premiumTrialAlreadyUsed: "Сиз совғани аллақачон ишлатгансиз.",
    premiumInvoiceMonthlyTitle: "Taomchi Premium — 1 ой",
    premiumInvoiceYearlyTitle: "Taomchi Premium — 1 йил",
    premiumInvoiceDescription: "Кунига 15 марта AI'дан сўраш ва бошқа Premium имкониятлар",
    starsBuyPrompt: "⭐ Stars етарли эмасми? Тез ва осон сотиб олинг:",
    starsBuyBtn: "⭐ Stars сотиб олиш",
    referralIntro: (points, link) => `🎁 Дўстларингизни Taomchi'га таклиф қилинг!\n\nҲар бир янги дўст — 1 балл. 3 балл тўпласангиз, хоҳлаган битта Premium рецептни бепул очасиз.\n\n⭐ Сизнинг баллларингиз: ${points}\n\n🔗 Ҳаволангиз:\n${link}`,
    referralShareBtn: "📤 Улашиш",
    referralShareText: "Taomchi — овқат рецептлари ва AI ёрдамчи билан! Менга қўшилинг 👇",
    referralShopAiBtn: "🤖 2 балл — +1 AI сўров",
    referralShopPremium3dBtn: "⭐ 8 балл — 3 кунлик Premium",
    referralShopPremium30dBtn: "👑 20 балл — 1 ойлик Premium",
    referralShopSuccess: "Муваффақиятли олинди! 🎉",
    referralShopNotEnough: "Баллларингиз етарли эмас.",
    subscribeRequired: "🔒 Botdan фойдаланиш учун қуйидаги канал(лар)га обуна бўлинг, сўнг \"Текшириш\" тугмасини босинг:",
    subscribeCheckBtn: "✅ Текшириш",
    subscribeSuccess: "✅ Обуна тасдиқланди! Ботдан фойдаланишингиз мумкин.",
    subscribeStillMissing: "❌ Сиз ҳали барча каналларга обуна бўлмагансиз.",
    viewRecipe: "📖 Рецептни кўриш",
    viewShort: "📖 Кўриш",
    noRecipes: "Ҳозирча рецептлар мавжуд эмас.",
    errorMsg: "Хатолик юз берди, бироздан кейин қайта уриниб кўринг.",
    searchUsage: "Қидириш учун шундай ёзинг: /qidir ош",
    noMatches: (q) => `"${q}" бўйича ҳеч нарса топилмади.`,
    minutes: "дақиқа",
    hours: "соат",
    timeUnknown: "Номаълум",
    difficulty: { oson: "🟢 Осон", orta: "🟡 Ўрта", qiyin: "🔴 Қийин" }
  }
};

// Foydalanuvchi "AI'dan so'rash" tugmasini bosgach, keyingi yuboradigan
// matnini savol sifatida kutish uchun.
const awaitingAiQuestion = new Set();

// Limit tugaganda va foydalanuvchi to'lov qilishga qaror qilsa, savolini
// qayta yozdirmaslik uchun — to'lov muvaffaqiyatli bo'lgach shu yerdan
// olib, avtomatik javob beriladi.
const pendingPaidQuestion = new Map(); // userId -> { question, lang }

// Faoliyatdagi (warm) funksiya uchun tezkor xotira — har bir xabarda
// Firestore'ga qayta-qayta murojaat qilmaslik uchun (tezlik uchun muhim)
const langCache = new Map();

// Foydalanuvchini Firestore'ga yozish (birinchi marta kirganda)
async function ensureUser(ctx) {
  const db = getDb();
  const userId = String(ctx.from.id);
  const userRef = db.collection("users").doc(userId);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      firstName: ctx.from.first_name || "",
      username: ctx.from.username || "",
      createdAt: Date.now(),
      isPremium: false,
      premiumUntil: null,
      trialUsed: false,
      language: null,
      notificationsEnabled: true
    });
    return { isNew: true, language: null };
  }

  const language = doc.data().language || null;
  if (language) langCache.set(userId, language);
  return { isNew: false, language };
}

async function getUserLang(ctx) {
  const userId = String(ctx.from.id);
  if (langCache.has(userId)) return langCache.get(userId);

  try {
    const db = getDb();
    const doc = await db.collection("users").doc(userId).get();
    const lang = (doc.exists && doc.data().language) || "uz";
    langCache.set(userId, lang);
    return lang;
  } catch {
    return "uz";
  }
}

async function sendWelcome(ctx, lang) {
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;

  await ctx.reply(t.welcome, {
    reply_markup: {
      inline_keyboard: [[
        { text: t.openApp, web_app: { url: process.env.MINI_APP_URL } }
      ]]
    }
  });

  await ctx.reply(t.quickCommands, {
    reply_markup: {
      keyboard: [
        [t.randomBtnLabel],
        [{ text: t.pantryBtnLabel, web_app: { url: `${process.env.MINI_APP_URL}/pantry.html` } }],
        [{ text: t.weeklyBtnLabel, web_app: { url: `${process.env.MINI_APP_URL}/weekly-menu.html` } }],
        [t.aiBtnLabel],
        [t.premiumBtnLabel],
        [t.referralBtnLabel]
      ],
      resize_keyboard: true
    }
  });
}

function langSelectMarkup() {
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: "🇺🇿 Lotin", callback_data: "lang_uz" },
        { text: "🇺🇿 Кирилл", callback_data: "lang_uzk" }
      ]]
    }
  };
}

// ===== Majburiy obuna middleware — har bir xabarda tekshiradi =====
bot.use(async (ctx, next) => {
  if (ctx.updateType !== "message" || !ctx.from) return next();
  if (ctx.message.successful_payment) return next();
  if (String(ctx.from.id) === ADMIN_CHAT_ID) return next();

  try {
    const db = getDb();
    const channels = await getCachedActiveChannels(db);
    if (channels.length === 0) return next();

    const missing = await getMissingChannels(ctx, channels);
    if (missing.length === 0) return next();

    const lang = await getUserLang(ctx);
    return sendSubscriptionRequired(ctx, lang, missing);
  } catch (err) {
    console.error("Obuna tekshiruvida xato:", err);
    return next(); // xatolik bo'lsa botni butunlay to'xtatib qo'ymaymiz
  }
});

// ===== /start =====
bot.start(async (ctx) => {
  let language = null;
  try {
    const result = await ensureUser(ctx);
    language = result.language;

    // Referal havola orqali kirgan bo'lsa ("ref_<userId>") — faqat yangi
    // foydalanuvchi uchun va faqat 1 marta taklif qilganga ball beriladi.
    if (result.isNew && typeof ctx.startPayload === "string" && ctx.startPayload.startsWith("ref_")) {
      const referrerId = ctx.startPayload.slice(4);
      if (referrerId) {
        const db = getDb();
        await creditReferral(db, referrerId, ctx.from.id);
      }
    }
  } catch (err) {
    console.error("Foydalanuvchini saqlashda xato:", err);
  }

  if (!language) {
    return ctx.reply("Tilni tanlang / Тилни танланг:", langSelectMarkup());
  }

  await sendWelcome(ctx, language);
});

// ===== /til — istalgan payt tilni almashtirish =====
bot.command("til", async (ctx) => {
  await ctx.reply("Tilni tanlang / Тилни танланг:", langSelectMarkup());
});

// ===== Til tanlash tugmasi bosilganda =====
bot.action(["lang_uz", "lang_uzk"], async (ctx) => {
  try {
    const lang = ctx.callbackQuery.data === "lang_uz" ? "uz" : "uzk";
    const db = getDb();
    await db.collection("users").doc(String(ctx.from.id)).set(
      { language: lang },
      { merge: true }
    );
    langCache.set(String(ctx.from.id), lang);
    await ctx.answerCbQuery();
    await sendWelcome(ctx, lang);
  } catch (err) {
    console.error("Til tanlashda xato:", err);
  }
});

// ===== Majburiy obuna — "Tekshirish" tugmasi =====
bot.action("check_subscription", async (ctx) => {
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;

  try {
    const db = getDb();
    const channels = await getCachedActiveChannels(db);
    const missing = await getMissingChannels(ctx, channels);

    if (missing.length === 0) {
      await ctx.answerCbQuery(t.subscribeSuccess, { show_alert: true });
      await ctx.deleteMessage().catch(() => {});
      await sendWelcome(ctx, lang);
    } else {
      await ctx.answerCbQuery(t.subscribeStillMissing, { show_alert: true });
    }
  } catch (err) {
    console.error("Obuna tekshiruvida xato:", err);
    await ctx.answerCbQuery(t.errorMsg, { show_alert: true });
  }
});

// ===== Kirillni lotinga o'girish (qidiruv uchun) =====
const CYR_TO_LAT = {
  "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"j","з":"z",
  "и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r",
  "с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"ts","ч":"ch","ш":"sh",
  "ъ":"'","ы":"i","ь":"","э":"e","ю":"yu","я":"ya","ў":"o'","қ":"q",
  "ғ":"g'","ҳ":"h"
};

function cyrToLat(str) {
  return str.split("").map(ch => CYR_TO_LAT[ch] ?? ch).join("");
}

// Retseptlar ro'yxati ham keshlanadi — har xabarda Firestore'ga
// qayta-qayta so'rov yubormaslik uchun (tezlik va xarajat uchun muhim)
let recipesCache = { data: null, savedAt: 0 };
const RECIPES_CACHE_TTL = 5 * 60 * 1000; // 5 daqiqa

async function getAllRecipes() {
  if (recipesCache.data && Date.now() - recipesCache.savedAt < RECIPES_CACHE_TTL) {
    return recipesCache.data;
  }
  const db = getDb();
  const snapshot = await db.collection("recipes").get();
  const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  recipesCache = { data: list, savedAt: Date.now() };
  return list;
}

// ===== Vaqt va qiyinchilik formatlash (bot xabarlarida ishlatiladi) =====
function formatCookTimeBot(r, t) {
  if (r.cookTimeUnit === "nomalum") return t.timeUnknown;
  if (r.cookTimeUnit === "soat") return `${r.cookTime || "-"} ${t.hours}`;
  return `${r.cookTime || "-"} ${t.minutes}`;
}

function formatDifficultyBot(r, t) {
  return t.difficulty[r.difficulty] || "";
}

// ===== Tasodifiy taom (faqat asosiy taomlar va sho'rvalar) =====
async function sendRandomRecipe(ctx, t) {
  const all = await getAllRecipes();
  const pool = all.filter(r => r.category === "main" || r.category === "soup");
  const list = pool.length > 0 ? pool : all;

  if (list.length === 0) {
    return ctx.reply(t.noRecipes);
  }

  const r = list[Math.floor(Math.random() * list.length)];

  await ctx.reply(
    `🍲 ${r.title}\n⏱ ${formatCookTimeBot(r, t)}   ${formatDifficultyBot(r, t)}`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: t.viewRecipe, web_app: { url: `${process.env.MINI_APP_URL}/recipe-detail.html?id=${r.id}` } }
        ]]
      }
    }
  );
}

bot.hears(/tasodifiy taom|тасодифий таом/i, async (ctx) => {
  awaitingAiQuestion.delete(String(ctx.from.id)); // AI kutayotgan holat bo'lsa, tozalanadi
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  try {
    await sendRandomRecipe(ctx, t);
  } catch (err) {
    console.error("Tasodifiy taom xatosi:", err);
    await ctx.reply(t.errorMsg);
  }
});

// ===== AI'dan so'rash =====
bot.hears(/AI'dan so'rash|AI'дан сўраш/i, async (ctx) => {
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  awaitingAiQuestion.add(String(ctx.from.id));
  await ctx.reply(t.aiPrompt);
});

// Yuqoridagi tugma bosilgach, keyingi oddiy matnli xabar savol sifatida
// qabul qilinadi. Bu handler eng oxirida turishi shart — aks holda boshqa
// buyruq/tugmalar (masalan "Tasodifiy taom") ham shu yerga tushib qolishi
// mumkin edi.
bot.on("text", async (ctx, next) => {
  const userId = String(ctx.from.id);
  if (!awaitingAiQuestion.has(userId)) return next();
  awaitingAiQuestion.delete(userId);

  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  const question = ctx.message.text.trim();

  const thinkingMsg = await ctx.reply(t.aiThinking);

  try {
    const db = getDb();
    const quota = await checkAndConsumeAiQuota(db, userId);

    if (!quota.allowed) {
      pendingPaidQuestion.set(userId, { question, lang });
      await ctx.telegram.editMessageText(ctx.chat.id, thinkingMsg.message_id, undefined, t.aiLimitReached, {
        reply_markup: {
          inline_keyboard: [[
            { text: t.premiumMonthlyBtn(MONTHLY_STARS_PRICE), callback_data: "premium_buy_monthly" },
            { text: t.premiumYearlyBtn(YEARLY_STARS_PRICE), callback_data: "premium_buy_yearly" }
          ]]
        }
      });
      await ctx.replyWithInvoice({
        title: t.aiInvoiceTitle,
        description: t.aiInvoiceDescription,
        payload: `ai_bonus_${userId}`,
        provider_token: "", // Telegram Stars uchun bo'sh qoldiriladi
        currency: "XTR",
        prices: [{ label: t.aiInvoiceTitle, amount: EXTRA_QUESTION_STARS_PRICE }]
      });
      await ctx.reply(t.starsBuyPrompt, { reply_markup: { inline_keyboard: [[{ text: t.starsBuyBtn, url: STARS_BOT_URL }]] } });
      return;
    }

    const answer = await askFoodAssistant(question, lang);
    await ctx.telegram.editMessageText(ctx.chat.id, thinkingMsg.message_id, undefined, answer);
  } catch (err) {
    console.error("AI javob xatosi:", err);
    await ctx.telegram.editMessageText(ctx.chat.id, thinkingMsg.message_id, undefined, t.aiError).catch(() => {});
  }
});

// ===== Referal (bot chatda) =====
async function sendReferralInfo(ctx, lang) {
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  const userId = String(ctx.from.id);

  try {
    const db = getDb();
    const status = await getReferralStatus(db, userId);
    const username = await getBotUsername();
    const link = `https://t.me/${username}?start=ref_${userId}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t.referralShareText)}`;

    await ctx.reply(t.referralIntro(status.points, link), {
      reply_markup: {
        inline_keyboard: [
          [{ text: t.referralShareBtn, url: shareUrl }],
          [{ text: t.referralShopAiBtn, callback_data: "redeem_ai_bonus" }],
          [{ text: t.referralShopPremium3dBtn, callback_data: "redeem_premium_3d" }],
          [{ text: t.referralShopPremium30dBtn, callback_data: "redeem_premium_30d" }]
        ]
      }
    });
  } catch (err) {
    console.error("Referral ma'lumotini olishda xato:", err);
    await ctx.reply(t.errorMsg);
  }
}

bot.command("referral", async (ctx) => {
  awaitingAiQuestion.delete(String(ctx.from.id));
  const lang = await getUserLang(ctx);
  await sendReferralInfo(ctx, lang);
});

bot.hears(/🎁/, async (ctx) => {
  awaitingAiQuestion.delete(String(ctx.from.id));
  const lang = await getUserLang(ctx);
  await sendReferralInfo(ctx, lang);
});

// Ballar do'koni — bot chatdan to'g'ridan-to'g'ri sotib olish.
bot.action("redeem_ai_bonus", async (ctx) => {
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  try {
    const db = getDb();
    const result = await redeemAiBonus(db, String(ctx.from.id));
    await ctx.answerCbQuery();
    await ctx.reply(result.success ? t.referralShopSuccess : t.referralShopNotEnough);
  } catch (err) {
    console.error("Referral shop (ai_bonus) xatosi:", err);
    await ctx.answerCbQuery();
    await ctx.reply(t.errorMsg);
  }
});

bot.action("redeem_premium_3d", async (ctx) => {
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  try {
    const db = getDb();
    const result = await redeemPremiumDays(db, String(ctx.from.id), PREMIUM_3D_DAYS, PREMIUM_3D_COST);
    await ctx.answerCbQuery();
    await ctx.reply(result.success ? t.referralShopSuccess : t.referralShopNotEnough);
  } catch (err) {
    console.error("Referral shop (premium_3d) xatosi:", err);
    await ctx.answerCbQuery();
    await ctx.reply(t.errorMsg);
  }
});

bot.action("redeem_premium_30d", async (ctx) => {
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  try {
    const db = getDb();
    const result = await redeemPremiumDays(db, String(ctx.from.id), PREMIUM_30D_DAYS, PREMIUM_30D_COST);
    await ctx.answerCbQuery();
    await ctx.reply(result.success ? t.referralShopSuccess : t.referralShopNotEnough);
  } catch (err) {
    console.error("Referral shop (premium_30d) xatosi:", err);
    await ctx.answerCbQuery();
    await ctx.reply(t.errorMsg);
  }
});

// ===== Premium (bot chatda) =====
async function sendPremiumInfo(ctx, lang) {
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  const userId = String(ctx.from.id);

  try {
    const db = getDb();
    const status = await getPremiumStatus(db, userId);

    if (status.active) {
      await ctx.reply(t.premiumActiveStatus(status.daysLeft));
      return;
    }

    const buttons = [];
    if (status.trialAvailable) {
      buttons.push([{ text: t.premiumTrialBtn(status.trialDays), callback_data: "premium_trial" }]);
    }
    buttons.push([
      { text: t.premiumMonthlyBtn(status.monthlyStarsPrice), callback_data: "premium_buy_monthly" },
      { text: t.premiumYearlyBtn(status.yearlyStarsPrice), callback_data: "premium_buy_yearly" }
    ]);
    buttons.push([{ text: t.starsBuyBtn, url: STARS_BOT_URL }]);

    const introText = status.trialAvailable
      ? t.premiumGiftPrompt(status.trialDays) + "\n\n" + t.premiumBuyPrompt
      : t.premiumBuyPrompt;

    await ctx.reply(introText, { reply_markup: { inline_keyboard: buttons } });
  } catch (err) {
    console.error("Premium ma'lumotini olishda xato:", err);
    await ctx.reply(t.errorMsg);
  }
}

bot.command("premium", async (ctx) => {
  awaitingAiQuestion.delete(String(ctx.from.id));
  const lang = await getUserLang(ctx);
  await sendPremiumInfo(ctx, lang);
});

bot.hears(/⭐ Premium/i, async (ctx) => {
  awaitingAiQuestion.delete(String(ctx.from.id));
  const lang = await getUserLang(ctx);
  await sendPremiumInfo(ctx, lang);
});

bot.action("premium_trial", async (ctx) => {
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  try {
    const db = getDb();
    const result = await claimPremiumTrial(db, String(ctx.from.id));
    await ctx.answerCbQuery();
    await ctx.reply(result.success ? t.premiumTrialClaimed : t.premiumTrialAlreadyUsed);
  } catch (err) {
    console.error("Trial claim xatosi:", err);
    await ctx.answerCbQuery();
    await ctx.reply(t.errorMsg);
  }
});

bot.action(["premium_buy_monthly", "premium_buy_yearly"], async (ctx) => {
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  const plan = ctx.callbackQuery.data === "premium_buy_yearly" ? "yearly" : "monthly";
  const userId = String(ctx.from.id);

  try {
    await ctx.answerCbQuery();
    await ctx.replyWithInvoice({
      title: plan === "yearly" ? t.premiumInvoiceYearlyTitle : t.premiumInvoiceMonthlyTitle,
      description: t.premiumInvoiceDescription,
      payload: `premium_${plan}_${userId}`,
      provider_token: "", // Telegram Stars uchun bo'sh qoldiriladi
      currency: "XTR",
      prices: [{ label: "Taomchi Premium", amount: plan === "yearly" ? YEARLY_STARS_PRICE : MONTHLY_STARS_PRICE }]
    });
  } catch (err) {
    console.error("Premium invoice xatosi:", err);
    await ctx.reply(t.errorMsg);
  }
});

// Telegram har qanday to'lovdan oldin tasdiqlash so'raydi — shuni
// darhol qabul qilamiz (aks holda to'lov amalga oshmaydi).
bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

// To'lov muvaffaqiyatli o'tgach — payload turiga qarab tegishli huquqni
// beramiz: "ai_bonus_" — bitta qo'shimcha AI so'rovi, "premium_" — Premium
// obuna (oylik yoki yillik). Bir xil handler ham bot chat, ham Mini App
// (tg.openInvoice) orqali qilingan to'lovlarni qamrab oladi.
bot.on("successful_payment", async (ctx) => {
  const userId = String(ctx.from.id);
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  const payload = ctx.message.successful_payment.invoice_payload || "";

  try {
    const db = getDb();

    if (payload.startsWith("premium_monthly_")) {
      await activatePremiumSubscription(db, userId, "monthly");
      await ctx.reply(t.premiumPaymentThanks);
      return;
    }

    if (payload.startsWith("premium_yearly_")) {
      await activatePremiumSubscription(db, userId, "yearly");
      await ctx.reply(t.premiumPaymentThanks);
      return;
    }

    // Aks holda — AI bonus so'rovi (eski/standart oqim)
    await grantBonusQuestion(db, userId);
    await ctx.reply(t.aiPaymentThanks);

    const pending = pendingPaidQuestion.get(userId);
    if (!pending) return;
    pendingPaidQuestion.delete(userId);

    const quota = await checkAndConsumeAiQuota(db, userId); // bonus'ni "ishlatib" qo'yadi
    if (!quota.allowed) return; // bo'lishi kerak emas, lekin ehtiyot uchun

    const answer = await askFoodAssistant(pending.question, pending.lang);
    await ctx.reply(answer);
  } catch (err) {
    console.error("To'lovdan keyingi javob xatosi:", err);
  }
});

// ===== Taom qidirish: /qidir osh =====
bot.command("qidir", async (ctx) => {
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  const query = ctx.message.text.replace(/^\/qidir/i, "").trim().toLowerCase();

  if (!query) {
    return ctx.reply(t.searchUsage);
  }

  const searchQuery = cyrToLat(query);

  try {
    const all = await getAllRecipes();
    const matches = all
      .filter(r => cyrToLat((r.title || "").toLowerCase()).includes(searchQuery))
      .slice(0, 5);

    if (matches.length === 0) {
      return ctx.reply(t.noMatches(query));
    }

    for (const r of matches) {
      await ctx.reply(
        `🍲 ${r.title}\n⏱ ${r.cookTime || "-"} ${t.minutes}`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: t.viewShort, web_app: { url: `${process.env.MINI_APP_URL}/recipe-detail.html?id=${r.id}` } }
            ]]
          }
        }
      );
    }
  } catch (err) {
    console.error("Qidirishda xato:", err);
    await ctx.reply(t.errorMsg);
  }
});

// ===== /xabar — barcha foydalanuvchilarga xabar yuborish (faqat admin) =====
function isAdmin(ctx) {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  return adminId && String(ctx.from.id) === String(adminId);
}

async function broadcastToAll(ctx, sendOne) {
  await ctx.reply("⏳ Xabar yuborilmoqda, biroz kuting...");

  const db = getDb();
  const usersSnap = await db.collection("users").get();
  const userIds = usersSnap.docs.map(doc => doc.id);

  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await sendOne(userId);
      sent++;
    } catch (err) {
      failed++; // bot bloklangan yoki chat topilmadi
    }
    // Telegram limitidan chiqib ketmaslik uchun har xabar orasida kichik pauza
    await new Promise(resolve => setTimeout(resolve, 40));
  }

  await ctx.reply(`✅ Yuborildi: ${sent} ta\n❌ Yetkazilmadi: ${failed} ta\n👥 Jami: ${userIds.length} ta foydalanuvchi`);
}

// Matnli xabar: /xabar Matn...
bot.command("xabar", async (ctx) => {
  if (!isAdmin(ctx)) return;

  const text = ctx.message.text.replace(/^\/xabar/i, "").trim();
  if (!text) {
    return ctx.reply(
      "Xabar matnini yozing, masalan:\n/xabar Yangi retseptlar qo'shildi! Ko'rib chiqing 🍲\n\n" +
      "Rasm bilan yuborish uchun: rasmni tanlang, izoh (caption) qismiga\n/xabar Matningiz\ndeb yozib yuboring."
    );
  }

  await broadcastToAll(ctx, (userId) => ctx.telegram.sendMessage(userId, text));
});

// Rasmli xabar: rasmni /xabar Matn... izohi bilan yuborish
bot.on("photo", async (ctx) => {
  const caption = ctx.message.caption || "";
  if (!/^\/xabar/i.test(caption)) return; // oddiy rasm, broadcast emas — e'tiborsiz qoldiramiz

  if (!isAdmin(ctx)) return;

  const text = caption.replace(/^\/xabar/i, "").trim();
  const photoSizes = ctx.message.photo;
  const fileId = photoSizes[photoSizes.length - 1].file_id; // eng yuqori sifatli variant

  await broadcastToAll(ctx, (userId) =>
    ctx.telegram.sendPhoto(userId, fileId, text ? { caption: text } : {})
  );
});

module.exports = bot;
    
