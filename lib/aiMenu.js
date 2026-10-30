// ===== Ovqaty — AI haftalik menyu (faqat Premium) =====
// AI tasodifiy emas: ilovadagi HAQIQIY retseptlar ro'yxatidan tanlaydi
// (o'ylab topilgan taom bo'lmaydi), fasl, xilma-xillik va (ixtiyoriy)
// diyeta shartlarini hisobga oladi. AI xato qilsa ham natija to'liq
// bo'lishi uchun server tomonda tekshiriladi va bo'sh joylar to'ldiriladi.

const MENU_DAILY_LIMIT = 3;
const MEALS = ["lunch", "dinner"];
// public/weekly-menu.js dagi WEEKLY_CATEGORIES bilan bir xil bo'lishi shart
const MENU_CATEGORIES = ["main", "soup"];
const MAX_RECIPES_IN_PROMPT = 120;
const MIN_RECIPES = 7;

function getTashkentDateString() {
  const shifted = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

// Premium tekshiruvi + alohida kunlik hisoblagich (matn/rasm limitiga tegmaydi).
// Qaytaradi: { allowed, reason: "not_premium" | "limit" | null, remainingToday }
async function reserveMenuQuota(db, userId) {
  const userRef = db.collection("users").doc(String(userId));
  const today = getTashkentDateString();

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const data = doc.exists ? doc.data() : {};

    const isPremium = (data.premiumUntil || 0) > Date.now();
    if (!isPremium) return { allowed: false, reason: "not_premium", remainingToday: 0 };

    const usedToday = data.aiMenuUsageDate === today ? (data.aiMenuUsageCount || 0) : 0;
    if (usedToday >= MENU_DAILY_LIMIT) return { allowed: false, reason: "limit", remainingToday: 0 };

    tx.set(userRef, { aiMenuUsageDate: today, aiMenuUsageCount: usedToday + 1 }, { merge: true });
    return { allowed: true, reason: null, remainingToday: MENU_DAILY_LIMIT - (usedToday + 1) };
  });
}

// Menyu tuzish muvaffaqiyatsiz bo'lsa (OpenAI xatosi va h.k.) — sarflangan
// urinishni qaytaradi, foydalanuvchi bekorga yo'qotmasin.
async function refundMenuQuota(db, userId) {
  const userRef = db.collection("users").doc(String(userId));
  const today = getTashkentDateString();
  try {
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(userRef);
      const data = doc.exists ? doc.data() : {};
      if (data.aiMenuUsageDate !== today) return;
      const used = data.aiMenuUsageCount || 0;
      if (used > 0) tx.set(userRef, { aiMenuUsageCount: used - 1 }, { merge: true });
    });
  } catch (err) {
    console.error("AI menyu limitini qaytarishda xato:", err);
  }
}

// "YYYY-MM-DD" -> "winter" | "spring" | "summer" | "autumn"
function getSeason(dateKey) {
  const month = Number(String(dateKey).slice(5, 7));
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Firestore'dan menyuga mos retseptlarni (faqat ochiq "teaser" maydonlar) oladi.
// Ramazonga xos retseptlar oddiy haftalik menyuga kiritilmaydi.
async function loadCandidateRecipes(db, { dietOnly }) {
  const snap = await db.collection("recipes").where("category", "in", MENU_CATEGORIES).get();
  let list = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => r.title && !r.isRamadan);
  if (dietOnly) list = list.filter((r) => r.isDiet === true);
  return list;
}

function buildPrompt({ recipes, dates, season, dietOnly }) {
  const compact = recipes.map((r) => ({
    id: r.id,
    t: String(r.title).slice(0, 60),
    c: r.category,
    ...(r.cookTime ? { m: `${r.cookTime}${r.cookTimeUnit === "soat" ? "h" : "min"}` } : {})
  }));

  const system =
    "You are a meal-planning assistant for an Uzbek home-cooking app. " +
    "Plan lunch and dinner for each given date using ONLY the provided recipes. " +
    "Reply with a single JSON object and nothing else.";

  const user = JSON.stringify({
    season,
    dates,
    dietMode: dietOnly,
    recipes: compact,
    rules: [
      "Every date must get both \"lunch\" and \"dinner\".",
      "Use ONLY recipe ids from the list. Never invent ids.",
      "Do not repeat a recipe during the week when there are enough recipes (never more than twice).",
      "Do not use the same recipe for lunch and dinner on the same day.",
      "Make the week varied: mix soups (c=soup) and main dishes (c=main); avoid the same category for both meals of a day when possible.",
      "Season guidance: winter = warm, hearty dishes and more soups; summer = lighter dishes and fewer heavy fried dishes; spring and autumn = balanced.",
      "Quick dishes (small m) suit busy weekdays; longer dishes suit weekends."
    ],
    outputFormat: { days: { "YYYY-MM-DD": { lunch: "<id>", dinner: "<id>" } } }
  });

  return { system, user };
}

async function askModelForMenu(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ],
      response_format: { type: "json_object" },
      max_tokens: 700,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI xatosi (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI bo'sh javob qaytardi");
  return JSON.parse(content);
}

// AI javobini tekshiradi: faqat mavjud id'lar, faqat so'ralgan sanalar,
// bir kunda bir xil taom ikki marta emas. Noto'g'ri joylar bo'sh qoladi.
function sanitizeMenu(raw, dates, allowedIds) {
  const days = {};
  const source = raw && typeof raw === "object" && raw.days && typeof raw.days === "object" ? raw.days : {};

  for (const date of dates) {
    const entry = source[date] || {};
    const day = {};
    for (const meal of MEALS) {
      const id = entry[meal];
      if (typeof id === "string" && allowedIds.has(id)) day[meal] = id;
    }
    if (day.lunch && day.dinner && day.lunch === day.dinner) delete day.dinner;
    days[date] = day;
  }
  return days;
}

// Bo'sh qolgan joylarni ishlatilmagan retseptlar bilan to'ldiradi
// (avval ishlatilmaganlar, yetmasa eng kam ishlatilganlar) — natija har doim to'liq.
function fillGaps(days, dates, recipes) {
  const usage = new Map(recipes.map((r) => [r.id, 0]));
  for (const date of dates) {
    for (const meal of MEALS) {
      const id = days[date] && days[date][meal];
      if (id) usage.set(id, (usage.get(id) || 0) + 1);
    }
  }

  const shuffled = shuffle(recipes.map((r) => r.id));
  for (const date of dates) {
    days[date] = days[date] || {};
    for (const meal of MEALS) {
      if (days[date][meal]) continue;
      const other = days[date][meal === "lunch" ? "dinner" : "lunch"];
      const candidates = shuffled
        .filter((id) => id !== other)
        .sort((a, b) => (usage.get(a) || 0) - (usage.get(b) || 0));
      const pick = candidates[0];
      if (!pick) continue;
      days[date][meal] = pick;
      usage.set(pick, (usage.get(pick) || 0) + 1);
    }
  }
  return days;
}

// Asosiy funksiya. Xatolar: err.code = "not_enough_recipes" | "not_enough_diet"
async function generateWeeklyMenu(db, { dates, dietOnly }) {
  const all = await loadCandidateRecipes(db, { dietOnly });
  if (all.length < MIN_RECIPES) {
    const err = new Error(dietOnly ? "Diyeta retseptlari yetarli emas" : "Retseptlar yetarli emas");
    err.code = dietOnly ? "not_enough_diet" : "not_enough_recipes";
    throw err;
  }

  const recipes = shuffle(all).slice(0, MAX_RECIPES_IN_PROMPT);
  const allowedIds = new Set(recipes.map((r) => r.id));
  const prompt = buildPrompt({ recipes, dates, season: getSeason(dates[0]), dietOnly });

  const raw = await askModelForMenu(prompt);
  const days = sanitizeMenu(raw, dates, allowedIds);
  return fillGaps(days, dates, recipes);
}

module.exports = {
  MENU_DAILY_LIMIT,
  reserveMenuQuota,
  refundMenuQuota,
  generateWeeklyMenu,
  // test uchun
  getSeason,
  sanitizeMenu,
  fillGaps,
  getTashkentDateString
};
