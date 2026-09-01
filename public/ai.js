// ===== Taomchi — AI yordamchi sahifasi (chat ko'rinishi) =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const STARS_PRICE = 5;
const PREMIUM_MONTHLY_PRICE = 77;
const STARS_BOT_URL = "https://t.me/milliystar_bot?start=ref_7603550866";
const MAX_HISTORY_MESSAGES = 6; // ~3 juftlik savol-javob

const aiQuotaText = document.getElementById("aiQuotaText");
const aiQuestionInput = document.getElementById("aiQuestionInput");
const aiAskBtn = document.getElementById("aiAskBtn");
const aiChatMessages = document.getElementById("aiChatMessages");

// Suhbat konteksti — faqat matn juftliklari, xotirada (sahifa yopilsa yo'qoladi).
let chatHistory = [];

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

function scrollToBottom() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });
}

function addBubble(role, text, extraClass = "") {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble chat-bubble--${role}${extraClass ? " " + extraClass : ""}`;
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
  aiChatMessages.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

function addTypingIndicator() {
  const el = document.createElement("div");
  el.className = "chat-typing";
  el.id = "aiTypingIndicator";
  el.innerHTML = "<span></span><span></span><span></span>";
  aiChatMessages.appendChild(el);
  scrollToBottom();
  return el;
}

function removeTypingIndicator() {
  document.getElementById("aiTypingIndicator")?.remove();
}

function updateQuotaText(isPremium, remainingToday) {
  if (isPremium) {
    aiQuotaText.textContent = "⭐ " + t("ai_premium_unlimited", "Premium: cheksiz so'rov");
  } else if (remainingToday === 0) {
    aiQuotaText.textContent = "⏳ " + t("ai_limit_reached_short", "Bugungi limit tugadi");
  } else if (remainingToday != null) {
    aiQuotaText.textContent = "🆓 " + t("ai_free_remaining", "Bugun yana so'rash mumkin: ") + remainingToday;
  }
}

function autoResizeInput() {
  aiQuestionInput.style.height = "auto";
  aiQuestionInput.style.height = Math.min(aiQuestionInput.scrollHeight, 100) + "px";
}

async function askQuestion(question) {
  aiAskBtn.disabled = true;

  const typingEl = addTypingIndicator();

  try {
    const res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: tg.initData,
        question,
        lang: getCurrentLang(),
        history: chatHistory.slice(-MAX_HISTORY_MESSAGES)
      })
    });
    const data = await res.json();

    removeTypingIndicator();

    if (res.status === 429) {
      renderLimitReached(question);
      return;
    }
    if (!res.ok) throw new Error(data.error || "Server xatosi");

    addBubble("bot", data.answer);
    chatHistory.push({ role: "assistant", content: data.answer });
    updateQuotaText(data.isPremium, data.remainingToday);
  } catch (err) {
    removeTypingIndicator();
    addBubble("bot", "❌ " + err.message, "chat-bubble--error");
  } finally {
    aiAskBtn.disabled = false;
  }
}

function openStarsBot() {
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(STARS_BOT_URL);
  } else {
    window.open(STARS_BOT_URL, "_blank");
  }
}

function renderLimitReached(question) {
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble--limit";
  bubble.innerHTML = `
    <p>⏳ ${escapeHtml(t("ai_limit_reached_short", "Bugungi limit tugadi"))}</p>
    <button id="aiPayBtn" class="chat-pay-btn chat-pay-btn--secondary">⭐ ${STARS_PRICE} — ${escapeHtml(t("ai_pay_once_more", "yana 1 marta so'rash"))}</button>
    <button id="aiPremiumBtn" class="chat-pay-btn">👑 ${escapeHtml(t("premium_buy_subtitle_prefix", "Oyiga ⭐"))}${PREMIUM_MONTHLY_PRICE}${escapeHtml(t("premium_buy_subtitle_suffix", " — kuniga 15 marta AI'dan so'rang"))}</button>
    <p class="stars-buy-hint">${escapeHtml(t("stars_buy_prompt", "Stars yetarli emasmi? Milliy karta orqali soniyalarda sotib oling 👇"))}</p>
    <button id="aiStarsLinkBtn" class="chat-pay-btn chat-pay-btn--stars">${escapeHtml(t("stars_buy_btn", "⭐ Stars sotib olish"))}</button>
  `;
  aiChatMessages.appendChild(bubble);
  scrollToBottom();
  document.getElementById("aiPayBtn").addEventListener("click", () => payForExtraQuestion(question, bubble));
  document.getElementById("aiPremiumBtn").addEventListener("click", () => buyPremiumMonthly(bubble, question));
  document.getElementById("aiStarsLinkBtn").addEventListener("click", openStarsBot);
}

async function buyPremiumMonthly(limitBubble, question) {
  const btn = document.getElementById("aiPremiumBtn");
  btn.disabled = true;
  btn.textContent = t("ai_loading", "Yuklanmoqda...");

  try {
    const res = await fetch("/api/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData, action: "create_invoice", plan: "monthly" })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Server xatosi");

    tg.openInvoice(data.link, (status) => {
      if (status === "paid") {
        limitBubble.remove();
        askQuestion(question);
      } else {
        btn.disabled = false;
        btn.textContent = `👑 ${t("premium_buy_subtitle_prefix", "Oyiga ⭐")}${PREMIUM_MONTHLY_PRICE}${t("premium_buy_subtitle_suffix", " — kuniga 15 marta AI'dan so'rang")}`;
      }
    });
  } catch (err) {
    addBubble("bot", "❌ " + err.message, "chat-bubble--error");
  }
}

async function payForExtraQuestion(question, limitBubble) {
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
        limitBubble.remove();
        askQuestion(question);
      } else {
        payBtn.disabled = false;
        payBtn.textContent = `⭐ ${STARS_PRICE} Stars — ${t("ai_pay_once_more", "yana 1 marta so'rash")}`;
      }
    });
  } catch (err) {
    addBubble("bot", "❌ " + err.message, "chat-bubble--error");
  }
}

function sendMessage() {
  const question = aiQuestionInput.value.trim();
  if (!question) return;

  if (!tg?.initData) {
    addBubble("bot", t("ai_telegram_only", "Bu funksiya faqat Telegram ilovasi ichida ishlaydi."), "chat-bubble--error");
    return;
  }

  addBubble("user", question);
  chatHistory.push({ role: "user", content: question });

  aiQuestionInput.value = "";
  autoResizeInput();

  askQuestion(question);
}

aiAskBtn.addEventListener("click", sendMessage);

aiQuestionInput.addEventListener("input", autoResizeInput);

aiQuestionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Boshlang'ich salomlashuv xabari (Taomchi shaxsiyati bilan).
const greetingKeys = ["ai_greeting_1", "ai_greeting_2", "ai_greeting_3"];
const greetingKey = greetingKeys[Math.floor(Math.random() * greetingKeys.length)];
addBubble("bot", t(greetingKey));
