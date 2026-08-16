// ===== Taomchi — Telegram bot =====

const { Telegraf } = require("telegraf");
const { getDb } = require("../lib/firebaseAdmin");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Telegram'da "/" bosilganda buyruqlar ro'yxati avtomatik chiqishi uchun
bot.telegram.setMyCommands([
  { command: "start", description: "Botni ishga tushirish" },
  { command: "qidir", description: "Taom qidirish (masalan: /qidir osh)" },
  { command: "til", description: "Tilni almashtirish" }
]).catch(err => console.error("setMyCommands xatosi:", err));

// ===== Bot matnlari (Lotin / Kirill) =====
const BOT_TEXT = {
  uz: {
    welcome: "Assalomu alaykum! Taomchi'ga xush kelibsiz 🍲\n\n\"Bugun nima pishiraman?\" degan savolga endi hech qachon o'ylanib qolmaysiz.\n\nQuyidagi tugmalardan foydalaning, yoki to'liq ilovani oching:",
    openApp: "🍲 Taomchini ochish",
    quickCommands: "Tezkor buyruqlar:\n🎲 Tasodifiy taom — pastdagi tugma\n🍲 Taom qidirish — /qidir osh (masalan)\n🌐 Tilni almashtirish — /til",
    randomBtnLabel: "🎲 Tasodifiy taom",
    viewRecipe: "📖 Retseptni ko'rish",
    viewShort: "📖 Ko'rish",
    noRecipes: "Hozircha retseptlar mavjud emas.",
    errorMsg: "Xatolik yuz berdi, birozdan keyin qayta urinib ko'ring.",
    searchUsage: "Qidirish uchun shunday yozing: /qidir osh",
    noMatches: (q) => `"${q}" bo'yicha hech narsa topilmadi.`,
    minutes: "daqiqa"
  },
  uzk: {
    welcome: "Ассалому алайкум! Taomchi'га хуш келибсиз 🍲\n\n\"Бугун нима пиширaман?\" деган саволга энди ҳеч қачон ўйланиб қолмайсиз.\n\nҚуйидаги тугмалардан фойдаланинг, ёки тўлиқ иловани очинг:",
    openApp: "🍲 Taomchini очиш",
    quickCommands: "Тезкор буйруқлар:\n🎲 Тасодифий таом — пастдаги тугма\n🍲 Таом қидириш — /qidir ош (масалан)\n🌐 Тилни алмаштириш — /til",
    randomBtnLabel: "🎲 Тасодифий таом",
    viewRecipe: "📖 Рецептни кўриш",
    viewShort: "📖 Кўриш",
    noRecipes: "Ҳозирча рецептлар мавжуд эмас.",
    errorMsg: "Хатолик юз берди, бироздан кейин қайта уриниб кўринг.",
    searchUsage: "Қидириш учун шундай ёзинг: /qidir ош",
    noMatches: (q) => `"${q}" бўйича ҳеч нарса топилмади.`,
    minutes: "дақиқа"
  }
};

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

  return { isNew: false, language: doc.data().language || null };
}

async function getUserLang(ctx) {
  try {
    const db = getDb();
    const doc = await db.collection("users").doc(String(ctx.from.id)).get();
    return (doc.exists && doc.data().language) || "uz";
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
      keyboard: [[t.randomBtnLabel]],
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
    await ctx.answerCbQuery();
    await sendWelcome(ctx, lang);
  } catch (err) {
    console.error("Til tanlashda xato:", err);
  }
});

// ===== Tasodifiy taom (faqat asosiy taomlar va sho'rvalar) =====
async function sendRandomRecipe(ctx, t) {
  const db = getDb();
  const snapshot = await db.collection("recipes")
    .where("category", "in", ["main", "soup"])
    .get();

  if (snapshot.empty) {
    return ctx.reply(t.noRecipes);
  }

  const docs = snapshot.docs;
  const doc = docs[Math.floor(Math.random() * docs.length)];
  const r = doc.data();

  await ctx.reply(
    `🍲 ${r.title}\n⏱ ${r.cookTime || "-"} ${t.minutes}   ⭐ ${r.rating || "-"}`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: t.viewRecipe, web_app: { url: `${process.env.MINI_APP_URL}/recipe-detail.html?id=${doc.id}` } }
        ]]
      }
    }
  );
}

bot.hears(["🎲 Tasodifiy taom", "🎲 Тасодифий таом"], async (ctx) => {
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

  try {
    const db = getDb();
    const snapshot = await db.collection("recipes").get();
    const matches = snapshot.docs
      .filter(doc => (doc.data().title || "").toLowerCase().includes(query))
      .slice(0, 5);

    if (matches.length === 0) {
      return ctx.reply(t.noMatches(query));
    }

    for (const doc of matches) {
      const r = doc.data();
      await ctx.reply(
        `🍲 ${r.title}\n⏱ ${r.cookTime || "-"} ${t.minutes}`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: t.viewShort, web_app: { url: `${process.env.MINI_APP_URL}/recipe-detail.html?id=${doc.id}` } }
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

module.exports = bot;
  
