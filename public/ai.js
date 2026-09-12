// ===== Taomchi — AI yordamchi sahifasi (chat ko'rinishi) =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const STARS_PRICE = 5;
const PREMIUM_MONTHLY_PRICE = 77;
const STARS_BOT_URL = "https://t.me/milliystar_bot?start=ref_7603550866";
const MAX_HISTORY_MESSAGES = 6; // ~3 juftlik savol-javob (AI kontekst uchun)
const CONV_STORAGE_KEY = "taomchi_ai_conversations";
const LEGACY_CHAT_KEY = "taomchi_ai_chat_history"; // eski bitta-suhbatli versiyadan
const MAX_STORED_MESSAGES_PER_CONV = 40;
const MAX_CONVERSATIONS = 30;

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(CONV_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // davom etamiz, pastda bo'sh massiv qaytadi
  }

  // Eski (bitta suhbatli) versiyadan migratsiya — bir martalik.
  try {
    const legacyRaw = localStorage.getItem(LEGACY_CHAT_KEY);
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : null;
    if (Array.isArray(legacy) && legacy.length > 0) {
      const firstUserMsg = legacy.find((m) => m.role === "user");
      const migrated = [{
        id: genId(),
        title: firstUserMsg ? truncateTitle(firstUserMsg.content) : null,
        messages: legacy,
        updatedAt: Date.now()
      }];
      localStorage.removeItem(LEGACY_CHAT_KEY);
      return migrated;
    }
  } catch {
    // e'tibor bermaymiz
  }
  return [];
}

function persistConversations() {
  try {
    const trimmed = conversations
      .filter((c) => c.messages.length > 0)
      .slice(-MAX_CONVERSATIONS)
      .map((c) => ({ ...c, messages: c.messages.slice(-MAX_STORED_MESSAGES_PER_CONV) }));
    localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage to'lgan yoki mavjud bo'lmasa — jim o'tkazib yuboramiz
  }
}

function truncateTitle(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 38 ? clean.slice(0, 38) + "…" : clean;
}

function ensureConversationSaved() {
  if (!conversations.includes(activeConversation)) {
    conversations.push(activeConversation);
  }
  activeConversation.updatedAt = Date.now();
  persistConversations();
}

const aiQuotaText = document.getElementById("aiQuotaText");
const aiQuestionInput = document.getElementById("aiQuestionInput");
const aiAskBtn = document.getElementById("aiAskBtn");
const aiChatMessages = document.getElementById("aiChatMessages");
const chatHistoryBtn = document.getElementById("chatHistoryBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatHistoryOverlay = document.getElementById("chatHistoryOverlay");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");
const chatHistoryList = document.getElementById("chatHistoryList");

// Barcha suhbatlar ro'yxati (localStorage'da saqlanadi) va hozir ochiq turgani.
let conversations = loadConversations();
let activeConversation = null;

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
    // Xabarlarning haqiqiy oxirigacha skroll qilamiz (input panel uchun
    // ajratilgan pastki bo'sh joygacha emas) — aks holda qisqa suhbatlarda
    // (masalan yangi ochilganda) bo'sh joy ustida "osilib" qolamiz va
    // salomlashuv xabari ekrandan chiqib ketadi.
    const messagesBottom = aiChatMessages.getBoundingClientRect().bottom + window.scrollY;
    const targetTop = Math.max(0, messagesBottom - window.innerHeight + 90);
    window.scrollTo({ top: targetTop, behavior: "smooth" });
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
        history: activeConversation.messages.slice(-MAX_HISTORY_MESSAGES)
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
    activeConversation.messages.push({ role: "assistant", content: data.answer });
    ensureConversationSaved();
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
  activeConversation.messages.push({ role: "user", content: question });
  if (!activeConversation.title) activeConversation.title = truncateTitle(question);
  ensureConversationSaved();

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

function renderGreeting() {
  const greetingKeys = ["ai_greeting_1", "ai_greeting_2", "ai_greeting_3"];
  const greetingKey = greetingKeys[Math.floor(Math.random() * greetingKeys.length)];
  addBubble("bot", t(greetingKey));
}

function renderActiveConversation() {
  aiChatMessages.innerHTML = "";
  if (activeConversation.messages.length === 0) {
    renderGreeting();
    return;
  }
  activeConversation.messages.forEach((msg) => {
    addBubble(msg.role === "user" ? "user" : "bot", msg.content);
  });
}

function startNewConversation() {
  activeConversation = { id: genId(), title: null, messages: [], updatedAt: Date.now() };
  renderActiveConversation();
  closeHistoryPanel();
}

function formatConvDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(getCurrentLang() === "uz" ? "uz-UZ" : "ru-RU", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(getCurrentLang() === "uz" ? "uz-UZ" : "ru-RU", { day: "2-digit", month: "2-digit" });
}

function renderHistoryList() {
  chatHistoryList.innerHTML = "";
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  if (sorted.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-history-empty";
    empty.textContent = t("ai_history_empty", "Hali suhbatlar yo'q");
    chatHistoryList.appendChild(empty);
    return;
  }

  sorted.forEach((conv) => {
    const item = document.createElement("div");
    item.className = "chat-history-item" + (conv.id === activeConversation.id ? " active" : "");

    const main = document.createElement("div");
    main.className = "chat-history-item-main";
    const title = document.createElement("div");
    title.className = "chat-history-item-title";
    title.textContent = conv.title || t("ai_history_untitled", "Suhbat");
    const date = document.createElement("div");
    date.className = "chat-history-item-date";
    date.textContent = formatConvDate(conv.updatedAt);
    main.appendChild(title);
    main.appendChild(date);

    const delBtn = document.createElement("button");
    delBtn.className = "chat-history-delete-btn";
    delBtn.setAttribute("aria-label", "O'chirish");
    delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>';
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteConversation(conv.id);
    });

    item.appendChild(main);
    item.appendChild(delBtn);
    item.addEventListener("click", () => openConversation(conv.id));
    chatHistoryList.appendChild(item);
  });
}

function openConversation(id) {
  const conv = conversations.find((c) => c.id === id);
  if (!conv) return;
  activeConversation = conv;
  renderActiveConversation();
  closeHistoryPanel();
}

function deleteConversation(id) {
  conversations = conversations.filter((c) => c.id !== id);
  persistConversations();
  if (activeConversation.id === id) {
    if (conversations.length > 0) {
      activeConversation = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      renderActiveConversation();
    } else {
      startNewConversation();
    }
  }
  renderHistoryList();
}

function openHistoryPanel() {
  renderHistoryList();
  chatHistoryOverlay.classList.add("open");
}

function closeHistoryPanel() {
  chatHistoryOverlay.classList.remove("open");
}

chatHistoryBtn.addEventListener("click", openHistoryPanel);
closeHistoryBtn.addEventListener("click", closeHistoryPanel);
chatHistoryOverlay.addEventListener("click", (e) => {
  if (e.target === chatHistoryOverlay) closeHistoryPanel();
});
newChatBtn.addEventListener("click", () => {
  if (activeConversation && activeConversation.messages.length === 0) return; // allaqachon bo'sh suhbatdamiz
  startNewConversation();
});

// Boshlash: eng oxirgi suhbatni ochamiz, bo'lmasa yangisini boshlaymiz.
if (conversations.length > 0) {
  activeConversation = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  renderActiveConversation();
} else {
  startNewConversation();
}
