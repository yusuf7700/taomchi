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
const aiAttachBtn = document.getElementById("aiAttachBtn");
const aiImageInput = document.getElementById("aiImageInput");
const aiImagePreviewRow = document.getElementById("aiImagePreviewRow");
const aiChatMessages = document.getElementById("aiChatMessages");
const aiEmptyState = document.getElementById("aiEmptyState");
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

function addBubble(role, text, extraClass = "", images = []) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble chat-bubble--${role}${extraClass ? " " + extraClass : ""}`;
  const imgsHtml = images.length > 0
    ? `<div class="chat-bubble-image-grid">${images.map(src => `<img class="chat-bubble-image" src="${src}" alt="">`).join("")}</div>`
    : "";
  bubble.innerHTML = imgsHtml + escapeHtml(text || "").replace(/\n/g, "<br>");
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

// ===== Rasm biriktirish (faqat Premium, kuniga cheklangan) =====
const MAX_IMAGES_PER_MESSAGE = 4;
let pendingImages = []; // tayyorlangan (siqilgan) rasmlar — ["data:image/jpeg;base64,...", ...]

function resizeImageFile(file, maxDim = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Rasmni ochib bo'lmadi"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
}

function renderImagePreviewRow() {
  if (pendingImages.length === 0) {
    aiImagePreviewRow.classList.add("screen-hidden");
    aiImagePreviewRow.innerHTML = "";
    return;
  }
  aiImagePreviewRow.classList.remove("screen-hidden");
  aiImagePreviewRow.innerHTML = pendingImages.map((src, i) => `
    <div class="ai-image-preview-thumb">
      <img src="${src}" alt="">
      <button data-remove-index="${i}" aria-label="Rasmni olib tashlash">✕</button>
    </div>
  `).join("");
  aiImagePreviewRow.querySelectorAll("[data-remove-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      pendingImages.splice(Number(btn.getAttribute("data-remove-index")), 1);
      renderImagePreviewRow();
    });
  });
}

aiAttachBtn.addEventListener("click", () => aiImageInput.click());

aiImageInput.addEventListener("change", async () => {
  const files = [...(aiImageInput.files || [])].slice(0, MAX_IMAGES_PER_MESSAGE - pendingImages.length);
  aiImageInput.value = "";
  if (files.length === 0) return;

  try {
    const resized = await Promise.all(files.map((f) => resizeImageFile(f)));
    pendingImages.push(...resized);
    renderImagePreviewRow();
  } catch {
    // Rasmlardan biri o'qilmadi — jimgina e'tiborsiz qoldiramiz
  }
});

async function askQuestion(question, images = []) {
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
        history: activeConversation.messages.slice(-MAX_HISTORY_MESSAGES),
        images: images.length > 0 ? images : undefined
      })
    });
    const data = await res.json();

    removeTypingIndicator();

    if (res.status === 403 && data.error === "premium_required") {
      renderImagePremiumRequired();
      return;
    }
    if (res.status === 429) {
      renderLimitReached(question);
      return;
    }
    if (!res.ok) throw new Error(data.error || "Server xatosi");

    addBubble("bot", data.answer);
    activeConversation.messages.push({ role: "assistant", content: data.answer });
    ensureConversationSaved();
    if (images.length === 0) updateQuotaText(data.isPremium, data.remainingToday);
  } catch (err) {
    removeTypingIndicator();
    addBubble("bot", "❌ " + err.message, "chat-bubble--error");
  } finally {
    aiAskBtn.disabled = false;
  }
}

function renderImagePremiumRequired() {
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble--limit";
  bubble.innerHTML = `
    <p>🔒 ${escapeHtml(t("ai_image_premium_required", "Rasm orqali savol berish faqat Premium foydalanuvchilar uchun."))}</p>
    <button id="aiImagePremiumBtn" class="chat-pay-btn">👑 ${escapeHtml(t("premium_buy_subtitle_prefix", "Oyiga ⭐"))}${PREMIUM_MONTHLY_PRICE}${escapeHtml(t("premium_buy_subtitle_suffix", " — kuniga 15 marta AI'dan so'rang"))}</button>
  `;
  aiChatMessages.appendChild(bubble);
  scrollToBottom();
  document.getElementById("aiImagePremiumBtn").addEventListener("click", () => buyPremiumMonthly(bubble, null, "aiImagePremiumBtn"));
}

function openStarsBot() {
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(STARS_BOT_URL);
  } else {
    window.open(STARS_BOT_URL, "_blank");
  }
}

// Kunlik limit O'zbekiston vaqti bo'yicha 00:00da yangilanadi (server ham
// shu hisobdan foydalanadi — lib/aiAssistant.js). Qolgan vaqtni shu asosda
// hisoblaymiz, foydalanuvchi qurilmasining vaqt zonasidan qat'i nazar.
function formatTimeUntilQuotaReset() {
  const shiftedNow = new Date(Date.now() + 5 * 60 * 60 * 1000); // "Toshkent vaqti" sifatida UTC ko'rinishida
  const shiftedMidnight = Date.UTC(
    shiftedNow.getUTCFullYear(),
    shiftedNow.getUTCMonth(),
    shiftedNow.getUTCDate() + 1,
    0, 0, 0
  );
  const diffMs = Math.max(0, shiftedMidnight - shiftedNow.getTime());
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return t("ai_limit_reset_soon", "⏰ Yangi bepul so'rov: {m} daqiqadan keyin (00:00da yangilanadi)")
      .replace("{m}", minutes);
  }
  return t("ai_limit_reset", "⏰ Yangi bepul so'rov: {h} soat {m} daqiqadan keyin (00:00da yangilanadi)")
    .replace("{h}", hours)
    .replace("{m}", minutes);
}

function renderLimitReached(question) {
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble--limit";
  bubble.innerHTML = `
    <p>⏳ ${escapeHtml(t("ai_limit_reached_short", "Bugungi limit tugadi"))}</p>
    <p class="ai-limit-countdown">${escapeHtml(formatTimeUntilQuotaReset())}</p>
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

async function buyPremiumMonthly(limitBubble, question, btnId = "aiPremiumBtn") {
  const btn = document.getElementById(btnId);
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
        if (question) askQuestion(question);
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
  const imagesToSend = pendingImages;
  if (!question && imagesToSend.length === 0) return;

  if (!tg?.initData) {
    addBubble("bot", t("ai_telegram_only", "Bu funksiya faqat Telegram ilovasi ichida ishlaydi."), "chat-bubble--error");
    return;
  }

  aiEmptyState.classList.add("screen-hidden");
  addBubble("user", question, "", imagesToSend);
  // Eslatma: rasmlarning o'zi suhbat tarixida saqlanmaydi (faqat matn) —
  // xotira hajmini kichik saqlash uchun. Rasmlar faqat shu so'rov uchun
  // AI'ga yuboriladi.
  activeConversation.messages.push({ role: "user", content: question || t("ai_image_only_placeholder", "[rasm yuborildi]") });
  if (!activeConversation.title) activeConversation.title = truncateTitle(question || "🖼️");
  ensureConversationSaved();

  aiQuestionInput.value = "";
  autoResizeInput();
  pendingImages = [];
  renderImagePreviewRow();

  askQuestion(question, imagesToSend);
}

// "Bosh holat"dagi tezkor tugmalar va mashhur so'rov chiplari — bosilganda
// mos savolni to'ldirib, darhol yuboradi.
document.querySelectorAll("[data-prompt-key]").forEach(btn => {
  btn.addEventListener("click", () => {
    aiQuestionInput.value = t(btn.getAttribute("data-prompt-key"));
    sendMessage();
  });
});

aiAskBtn.addEventListener("click", sendMessage);

aiQuestionInput.addEventListener("input", autoResizeInput);

aiQuestionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function renderActiveConversation() {
  aiChatMessages.innerHTML = "";
  if (activeConversation.messages.length === 0) {
    aiEmptyState.classList.remove("screen-hidden");
    return;
  }
  aiEmptyState.classList.add("screen-hidden");
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

// Boshlash: har safar sahifa ochilganda yangi (bo'sh) suhbat bilan
// boshlaymiz — oldingi suhbatlar tarix panelida saqlanib qoladi, lekin
// avtomatik ochilmaydi.
startNewConversation();
