// ===== Taomchi — AI oshpazlik yordamchisi (umumiy logika) =====
// Bu fayl api/ai-chat.js (Mini App) va bot/bot.js (Telegram bot) ikkalasida
// ham ishlatiladi — bir xil limit va OpenAI so'rov mantig'ini takrorlamaslik
// uchun.

const FREE_DAILY_LIMIT = 1;

// O'zbekiston vaqti bo'yicha bugungi sana (YYYY-MM-DD), kunlik limitni
// to'g'ri "kun almashishi"ga bog'lash uchun.
function getTashkentDateString() {
  const shifted = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

// Foydalanuvchi AI'dan foydalanishi mumkinmi — tekshiradi va (ruxsat
// bo'lsa) darhol hisoblagichni oshiradi. Firestore transaction orqali —
// bir vaqtda bir nechta so'rov kelib qolsa ham, limit chetlab o'tilmasin.
// Qaytaradi: { allowed: boolean, isPremium: boolean, remainingToday: number }
async function checkAndConsumeAiQuota(db, userId) {
  const userRef = db.collection("users").doc(String(userId));
  const today = getTashkentDateString();

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(userRef);
    const data = doc.exists ? doc.data() : {};

    const isPremium = data.isPremium === true;
    if (isPremium) {
      return { allowed: true, isPremium: true, remainingToday: null };
    }

    const sameDay = data.aiUsageDate === today;
    const usedToday = sameDay ? (data.aiUsageCount || 0) : 0;

    if (usedToday >= FREE_DAILY_LIMIT) {
      return { allowed: false, isPremium: false, remainingToday: 0 };
    }

    tx.set(userRef, { aiUsageDate: today, aiUsageCount: usedToday + 1 }, { merge: true });
    return { allowed: true, isPremium: false, remainingToday: FREE_DAILY_LIMIT - (usedToday + 1) };
  });
}

const SYSTEM_PROMPT = {
  uz: "Siz \"Taomchi\" ilovasining oshpazlik yordamchisisiz. Faqat ovqat, retsept, oshxona mahsulotlari va pishirish jarayoni bilan bog'liq savollarga javob bering. Javobingiz o'zbek tilida (lotin alifbosida), qisqa, aniq va amaliy bo'lsin (odatda 3-6 gap). Agar savol ovqatga umuman aloqasi bo'lmasa, buni muloyimlik bilan ayting va ovqat haqida savol berishni taklif qiling.",
  uzk: "Сиз \"Taomchi\" иловасининг ошпазлик ёрдамчисисиз. Фақат овқат, рецепт, ошхона маҳсулотлари ва пишириш жараёни билан боғлиқ саволларга жавоб беринг. Жавобингиз ўзбек тилида (кирилл алифбосида), қисқа, аниқ ва амалий бўлсин (одатда 3-6 гап). Агар савол овқатга умуман алоқаси бўлмаса, буни мулойимлик билан айтинг ва овқат ҳақида савол беришни таклиф қилинг."
};

// OpenAI'ga so'rov yuboradi va javob matnini qaytaradi.
async function askFoodAssistant(question, lang) {
  const systemPrompt = SYSTEM_PROMPT[lang === "uzk" ? "uzk" : "uz"];

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
        { role: "user", content: String(question).slice(0, 500) } // haddan tashqari uzun matndan himoya
      ],
      max_tokens: 400,
      temperature: 0.7
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

module.exports = { checkAndConsumeAiQuota, askFoodAssistant, FREE_DAILY_LIMIT, getTashkentDateString };
