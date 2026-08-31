// ===== Taomchi — AI yordamchi sahifasi =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const STARS_PRICE = 5;

const aiQuotaText = document.getElementById("aiQuotaText");
const aiQuestionInput = document.getElementById("aiQuestionInput");
const aiAskBtn = document.getElementById("aiAskBtn");
const aiResultArea = document.getElementById("aiResultArea");

function t(key, fallback) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return dict[key] || fallback || key;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function updateQuotaText(isPremium, remainingToday) {
  if (isPremium) {
    aiQuotaText.textContent = "⭐ " + t("ai_premium_unlimited", "Premium: cheksiz so'rov");
  } else if (remainingToday === 0) {
    aiQuotaText.textContent = "⏳ " + t("ai_limit_reached_short", "Bugungi limit tugadi");
  } else {
    aiQuotaText.textContent = "🆓 " + t("ai_free_remaining", "Bugun yana so'rash mumkin: ") + remainingToday;
  }
}

async function askQuestion(question) {
  aiAskBtn.disabled = true;
  aiAskBtn.textContent = t("ai_thinking", "O'ylanmoqda...");
  aiResultArea.innerHTML = "";

  try {
    const res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, question, lang: getCurrentLang() })
    });
    const data = await res.json();

    if (res.status === 429) {
      renderLimitReached(question);
      return;
    }
    if (!res.ok) throw new Error(data.error || "Server xatosi");

    aiResultArea.innerHTML = `<div class="ai-answer-card">${escapeHtml(data.answer).replace(/\n/g, "<br>")}</div>`;
    updateQuotaText(data.isPremium, data.remainingToday);
    aiQuestionInput.value = "";
  } catch (err) {
    aiResultArea.innerHTML = `<p class="empty-text">❌ ${err.message}</p>`;
  } finally {
    aiAskBtn.disabled = false;
    aiAskBtn.textContent = t("ai_ask_btn", "So'rash");
  }
}

function renderLimitReached(question) {
  aiResultArea.innerHTML = `
    <p class="ai-limit-text">⏳ ${t("ai_limit_reached", "Bugungi bepul so'rov limiti tugadi.")}</p>
    <button id="aiPayBtn" class="ai-ask-btn" style="margin-top:10px;">⭐ ${STARS_PRICE} Stars — ${t("ai_pay_once_more", "yana 1 marta so'rash")}</button>
  `;
  document.getElementById("aiPayBtn").addEventListener("click", () => payForExtraQuestion(question));
}

async function payForExtraQuestion(question) {
  const payBtn = document.getElementById("aiPayBtn");
  payBtn.disabled = true;
  payBtn.textContent = t("ai_loading", "Yuklanmoqda...");

  try {
    const res = await fetch("/api/create-ai-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Server xatosi");

    tg.openInvoice(data.link, (status) => {
      if (status === "paid") {
        // To'lov tasdiqlangach, xuddi shu savolni serverga qayta yuboramiz —
        // server tomonida endi "bonus" huquq mavjud, shuning uchun o'tadi.
        askQuestion(question);
      } else {
        payBtn.disabled = false;
        payBtn.textContent = `⭐ ${STARS_PRICE} Stars — ${t("ai_pay_once_more", "yana 1 marta so'rash")}`;
      }
    });
  } catch (err) {
    aiResultArea.innerHTML = `<p class="empty-text">❌ ${err.message}</p>`;
  }
}

aiAskBtn.addEventListener("click", () => {
  const question = aiQuestionInput.value.trim();
  if (!question) return;

  if (!tg?.initData) {
    aiResultArea.innerHTML = `<p class="empty-text">${t("ai_telegram_only", "Bu funksiya faqat Telegram ilovasi ichida ishlaydi.")}</p>`;
    return;
  }

  askQuestion(question);
});
