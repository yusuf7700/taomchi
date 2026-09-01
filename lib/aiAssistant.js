// ===== Taomchi — AI oshpazlik yordamchisi (umumiy logika) =====
// Bu fayl api/ai-chat.js (Mini App) va bot/bot.js (Telegram bot) ikkalasida
// ham ishlatiladi — bir xil limit va OpenAI so'rov mantig'ini takrorlamaslik
// uchun.

const FREE_DAILY_LIMIT = 1;
const PREMIUM_DAILY_LIMIT = 15;
const EXTRA_QUESTION_STARS_PRICE = 5;

// O'zbekiston vaqti bo'yicha bugungi sana (YYYY-MM-DD), kunlik limitni
// to'g'ri "kun almashishi"ga bog'lash uchun.
function getTashkentDateString() {
  const shifted = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

// Foydalanuvchi AI'dan foydalanishi mumkinmi — tekshiradi va (ruxsat
// bo'lsa) darhol hisoblagichni oshiradi. Firestore transaction orqali —
// bir vaqtda bir nechta so'rov kelib qolsa ham, limit chetlab o'tilmasin.
//
// Tartib: 1) agar "bonus" (Stars to'lab olingan qo'shimcha so'rov) bor
// bo'lsa — shu ishlatiladi, kunlik limitga umuman tegmaydi;
// 2) aks holda kunlik limit (bepul: 1, Premium: 15) tekshiriladi.
//
// Qaytaradi: { allowed, isPremium, usedBonus, remainingToday }
async function checkAndConsumeAiQuota(db, userId) {
  const userRef = db.collection("users").doc(String(userId));
  const today = getTashkentDateString();

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const data = doc.exists ? doc.data() : {};

    const bonusCredits = data.aiBonusCredits || 0;
    if (bonusCredits > 0) {
      tx.set(userRef, { aiBonusCredits: bonusCredits - 1 }, { merge: true });
      return { allowed: true, isPremium: (data.premiumUntil || 0) > Date.now(), usedBonus: true, remainingToday: null };
    }

    const isPremium = (data.premiumUntil || 0) > Date.now();
    const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

    const sameDay = data.aiUsageDate === today;
    const usedToday = sameDay ? (data.aiUsageCount || 0) : 0;

    if (usedToday >= dailyLimit) {
      return { allowed: false, isPremium, usedBonus: false, remainingToday: 0 };
    }

    tx.set(userRef, { aiUsageDate: today, aiUsageCount: usedToday + 1 }, { merge: true });
    return { allowed: true, isPremium, usedBonus: false, remainingToday: dailyLimit - (usedToday + 1) };
  });
}

// To'lov muvaffaqiyatli bo'lgach chaqiriladi — foydalanuvchiga 1ta
// "bonus" (kunlik limitdan tashqari) so'rov huquqini qo'shadi.
async function grantBonusQuestion(db, userId) {
  const { FieldValue } = require("firebase-admin/firestore");
  const userRef = db.collection("users").doc(String(userId));
  await userRef.set({ aiBonusCredits: FieldValue.increment(1) }, { merge: true });
}

const SYSTEM_PROMPT = {
  uz: "Sen \"Taomchi\" ilovasining oshpaz do'stisan — quvnoq, samimiy va yordamga tayyor. Foydalanuvchi bilan xuddi tanish oshpaz og'a/opa bilan gaplashganday, jonli va tabiiy uslubda gapir (sovuq, ro'yxat-uslubidagi javoblardan qoch). O'zbek tilida (lotin alifbosida) yoz, kerak bo'lsa o'rinli emoji ishlat. Faqat ovqat, retsept, oshxona mahsulotlari va pishirish jarayoni bilan bog'liq mavzularda javob ber — javobing amaliy va aniq bo'lsin, lekin 3-6 gapdan oshmasin. Agar suhbat tarixi berilgan bo'lsa, uni hisobga olib xuddi davom etayotgan suhbatday javob ber (masalan foydalanuvchi 'yana nima qo'shsam bo'ladi' desa, oldingi taomni eslab javob ber). Agar savol ovqatga umuman aloqasi bo'lmasa, buni yumshoq hazil bilan ayt va ovqat haqida so'rashga taklif qil.",
  uzk: "Сен \"Taomchi\" иловасининг ошпаз дўстисан — қувноқ, самимий ва ёрдамга тайёр. Фойдаланувчи билан худди таниш ошпаз ога/опа билан гаплашгандай, жонли ва табиий услубда гапир (совуқ, рўйхат-услубидаги жавоблардан қоч). Ўзбек тилида (кирилл алифбосида) ёз, керак бўлса ўринли эмоджи ишлат. Фақат овқат, рецепт, ошхона маҳсулотлари ва пишириш жараёни билан боғлиқ мавзуларда жавоб бер — жавобинг амалий ва аниқ бўлсин, лекин 3-6 гапдан ошмасин. Агар суҳбат тарихи берилган бўлса, уни ҳисобга олиб худди давом этаётган суҳбатдай жавоб бер. Агар савол овқатга умуман алоқаси бўлмаса, буни юмшоқ ҳазил билан айт ва овқат ҳақида сўрашга таклиф қил."
};

// OpenAI'ga so'rov yuboradi va javob matnini qaytaradi.
// history: [{ role: "user"|"assistant", content: string }, ...] — oldingi
// 3-4 juftlik savol-javob (chat konteksti uchun). Ixtiyoriy.
async function askFoodAssistant(question, lang, history = []) {
  const systemPrompt = SYSTEM_PROMPT[lang === "uzk" ? "uzk" : "uz"];

  // Xavfsizlik va narx nazorati uchun: faqat oxirgi 6ta xabar (~3 juftlik),
  // har birining uzunligi cheklangan holda.
  const safeHistory = Array.isArray(history)
    ? history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))
    : [];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...safeHistory,
        { role: "user", content: String(question).slice(0, 500) } // haddan tashqari uzun matndan himoya
      ],
      max_tokens: 400,
      temperature: 0.8
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI xatosi (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const answer = data?.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("OpenAI bo'sh javob qaytardi");
  return answer;
}

module.exports = {
  checkAndConsumeAiQuota,
  grantBonusQuestion,
  askFoodAssistant,
  FREE_DAILY_LIMIT,
  PREMIUM_DAILY_LIMIT,
  EXTRA_QUESTION_STARS_PRICE,
  getTashkentDateString
};
