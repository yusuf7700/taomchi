// ===== Taomchi — Telegram bot =====

const { Telegraf } = require("telegraf");
const { getDb } = require("../lib/firebaseAdmin");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== Bot matnlari (Lotin / Kirill) =====
const BOT_TEXT = {
  uz: {
    welcome: "Assalomu alaykum! Taomchi'ga xush kelibsiz 🍲\n\n\"Bugun nima pishiraman?\" degan savolga endi hech qachon o'ylanib qolmaysiz.\n\nQuyidagi tugmalardan foydalaning, yoki to'liq ilovani oching:",
    openApp: "🍲 Taomchini ochish",
    quickCommands: "Tezkor buyruqlar:\n🍽️ Tasodifiy taom — pastdagi tugma\n🧺 Uyda nima bor? — pastdagi tugma\n🍲 Taom qidirish — /qidir osh (masalan)\n🌐 Tilni almashtirish — /til",
    randomBtnLabel: "🍽️ Tasodifiy taom",
    pantryBtnLabel: "🧺 Uyda nima bor?",
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
    quickCommands: "Тезкор буйруқлар:\n🍽️ Тасодифий таом — пастдаги тугма\n🧺 Уйда нима бор? — пастдаги тугма\n🍲 Таом қидириш — /qidir ош (масалан)\n🌐 Тилни алмаштириш — /til",
    randomBtnLabel: "🍽️ Тасодифий таом",
    pantryBtnLabel: "🧺 Уйда нима бор?",
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
      language: null
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
        [{ text: t.pantryBtnLabel, web_app: { url: `${process.env.MINI_APP_URL}/pantry.html` } }]
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

// ===== /start =====
bot.start(async (ctx) => {
  let language = null;
  try {
    const result = await ensureUser(ctx);
    language = result.language;
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
  const lang = await getUserLang(ctx);
  const t = BOT_TEXT[lang] || BOT_TEXT.uz;
  try {
    await sendRandomRecipe(ctx, t);
  } catch (err) {
    console.error("Tasodifiy taom xatosi:", err);
    await ctx.reply(t.errorMsg);
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
    
