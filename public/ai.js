// ===== Taomchi — AI yordamchi sahifasi =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const aiQuotaText = document.getElementById("aiQuotaText");
const aiQuestionInput = document.getElementById("aiQuestionInput");
const aiAskBtn = document.getElementById("aiAskBtn");
const aiResultArea = document.getElementById("aiResultArea");

function t(key, fallback) {
  const lang = getCurrentLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return dict[key] || fallback || key;
}

aiAskBtn.addEventListener("click", async () => {
  const question = aiQuestionInput.value.trim();
  if (!question) return;

  if (!tg?.initData) {
    aiResultArea.innerHTML = `<p class="empty-text">${t("ai_telegram_only", "Bu funksiya faqat Telegram ilovasi ichida ishlaydi.")}</p>`;
    return;
  }

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
      aiResultArea.innerHTML = `<p class="ai-limit-text">⏳ ${data.message || t("ai_limit_reached", "Bugungi bepul so'rov limiti tugadi.")}</p>`;
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
});

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
