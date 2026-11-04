// ===== Ovqaty — Telegram "tayyorlangan xabar" (rasm + sarlavha + tugma) =====
// Mini App'dan retsept yoki referal havolasini ulashganda oddiy matn o'rniga
// rasmli, tugmali xabar yuborish uchun: Bot API savePreparedInlineMessage -> id,
// keyin klientda Telegram.WebApp.shareMessage(id).
// Rasm: retsept rasmi (JPEG bo'lsa) yoki public/share/*.jpg dagi brend rasmi.

// Rasm yangilanganda fayl nomini o'zgartiring (-3, -4...): Telegram rasmni URL bo'yicha keshlaydi
const FALLBACK_IMAGE = { invite: "share/invite-2.jpg" };
// Retsept o'z rasmiga ega bo'lmasa — kategoriyasiga mos brend rasm (public/share/cat/<kategoriya>.jpg)
const CATEGORY_IMAGES = new Set(["main", "soup", "salad", "breakfast", "dessert", "pastry", "drinks", "diet"]);
// Xabar sarlavhasi oldidagi emoji — kategoriyaga mos (hammasiga 🍲 qo'yilmasin)
const CATEGORY_EMOJI = { main: "🍛", soup: "🍲", salad: "🥗", breakfast: "🍳", dessert: "🍰", pastry: "🥟", drinks: "🍹", diet: "🥑" };
function categoryEmoji(category) {
  return CATEGORY_EMOJI[category] || "🍽️";
}
function categoryImagePath(category) {
  return `share/cat/${CATEGORY_IMAGES.has(category) ? category : "any"}.jpg`;
}

const TEXTS = {
  uz: {
    inviteTitle: "Muzlatgichdagini yozing, taom tayyor",
    inviteBody: "Ovqaty — \"nima pishirsam ekan?\" savoliga yechim. Qo'lingizdagi mahsulotlarni yozing, AI oshpaz mos taom va retseptni topib beradi. Haftalik menyu ham shu yerda.",
    inviteCta: "Qo'shiling 👇",
    inviteBtn: "Ovqatyni ochish",
    recipeCta: "To'liq retsept, masalliqlar va tayyorlash usuli — Ovqaty'da 👇",
    recipeBtn: "Retseptni ochish",
    units: { daqiqa: "daqiqa", soat: "soat" },
    diff: { oson: "Oson", orta: "O'rta", qiyin: "Qiyin" },
    menuTitle: "Mening haftalik menyum",
    menuCta: "Siz ham o'z haftalik menyungizni tuzing 👇",
    menuBtn: "Menyu tuzish",
    days: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
    months: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"]
  },
  uzk: {
    inviteTitle: "Музлатгичдагини ёзинг, таом тайёр",
    inviteBody: "Ovqaty — «нима пиширсам экан?» саволига ечим. Қўлингиздаги маҳсулотларни ёзинг, AI ошпаз мос таом ва рецептни топиб беради. Ҳафталик меню ҳам шу ерда.",
    inviteCta: "Қўшилинг 👇",
    inviteBtn: "Иловани очиш",
    recipeCta: "Тўлиқ рецепт, масаллиқлар ва тайёрлаш усули — Ovqaty иловасида 👇",
    recipeBtn: "Рецептни очиш",
    units: { daqiqa: "дақиқа", soat: "соат" },
    diff: { oson: "Осон", orta: "Ўрта", qiyin: "Қийин" },
    menuTitle: "Менинг ҳафталик менюм",
    menuCta: "Сиз ҳам ўз ҳафталик менюингизни тузинг 👇",
    menuBtn: "Меню тузиш",
    days: ["Як", "Ду", "Се", "Чо", "Па", "Жу", "Ша"],
    months: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"]
  }
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function baseUrl() {
  return String(process.env.MINI_APP_URL || "").replace(/\/+$/, "");
}

// Telegram inline "photo" natijasi faqat JPEG qabul qiladi
function jpegUrlFor(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string" || !/^https:\/\//i.test(imageUrl)) return null;
  try {
    const u = new URL(imageUrl);
    if (u.hostname === "res.cloudinary.com" && u.pathname.includes("/upload/")) {
      // kengaytma yetkazib berish formatini belgilaydi — .jpg ga almashtiramiz
      const withTransform = imageUrl.replace("/upload/", "/upload/f_jpg,w_1000,q_85/");
      return withTransform.replace(/\.[A-Za-z0-9]+(\?.*)?$/, ".jpg$1");
    }
    if (/\.jpe?g$/i.test(u.pathname)) return imageUrl;
  } catch { /* noto'g'ri URL */ }
  return null;
}

function recipeMeta(r, tx) {
  const parts = [];
  const time = String(r.cookTime ?? "").trim();
  if (r.cookTimeUnit !== "nomalum" && time && time !== "-" && time !== "0") {
    parts.push(`⏱ ${esc(time)} ${esc(tx.units[r.cookTimeUnit] || "")}`.trim());
  }
  if (tx.diff[r.difficulty]) parts.push(esc(tx.diff[r.difficulty]));
  return parts.join(" · ");
}

function buildResult({ kind, lang, link, recipe, recipeId, photoUrl }) {
  const tx = TEXTS[lang === "uzk" ? "uzk" : "uz"];
  let caption;
  let btn;
  if (kind === "recipe") {
    const title = (lang === "uzk" && recipe.titleCyrillic) ? recipe.titleCyrillic : recipe.title;
    const meta = recipeMeta(recipe, tx);
    caption = `<b>${categoryEmoji(recipe.category)} ${esc(title)}</b>\n${meta ? meta + "\n" : ""}\n${tx.recipeCta}`;
    btn = tx.recipeBtn;
  } else {
    caption = `<b>${esc(tx.inviteTitle)}</b>\n\n${esc(tx.inviteBody)}\n\n${tx.inviteCta}`;
    btn = tx.inviteBtn;
  }
  return {
    type: "photo",
    id: (kind === "recipe" ? `r_${recipeId}` : "invite").slice(0, 64),
    photo_url: photoUrl,
    thumbnail_url: photoUrl,
    caption,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [[{ text: btn, url: link }]] }
  };
}


// ===== Haftalik menyu xabari (matnli variant) =====
const MENU_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MENU_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

function shortTitle(s, n = 24) {
  const t = String(s || "").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

function weekRangeLabel(keys, tx) {
  const a = new Date(keys[0] + "T00:00:00Z");
  const b = new Date(keys[keys.length - 1] + "T00:00:00Z");
  const ma = tx.months[a.getUTCMonth()];
  const mb = tx.months[b.getUTCMonth()];
  const da = a.getUTCDate();
  const dbn = b.getUTCDate();
  if (keys.length === 1) return `${da} ${ma}`;
  return ma === mb ? `${da}–${dbn} ${ma}` : `${da} ${ma} – ${dbn} ${mb}`;
}

// menu: { "YYYY-MM-DD": { lunch: recipeId, dinner: recipeId } } — nomlarni mijozdan emas, bazadan olamiz
async function buildMenuCaption(db, menu, lang) {
  const tx = TEXTS[lang === "uzk" ? "uzk" : "uz"];
  const keys = Object.keys(menu || {}).filter((k) => MENU_KEY_RE.test(k)).sort().slice(0, 7);
  const ids = new Set();
  const days = [];
  for (const k of keys) {
    const d = menu[k] || {};
    const picked = ["lunch", "dinner"].map((m) => (typeof d[m] === "string" && MENU_ID_RE.test(d[m]) ? d[m] : null));
    if (picked[0] || picked[1]) {
      days.push({ key: k, ids: picked });
      picked.forEach((x) => x && ids.add(x));
    }
  }
  if (days.length === 0) throw new Error("Menyu bo'sh");

  const refs = [...ids].map((id) => db.collection("recipes").doc(id));
  const snaps = refs.length ? await db.getAll(...refs) : [];
  const titles = new Map();
  for (const sn of snaps) {
    if (!sn.exists) continue;
    const r = sn.data();
    titles.set(sn.id, shortTitle(lang === "uzk" && r.titleCyrillic ? r.titleCyrillic : r.title));
  }

  const lines = [];
  const shownKeys = [];
  for (const dday of days) {
    const names = dday.ids.map((id) => id && titles.get(id)).filter(Boolean);
    if (names.length === 0) continue;
    const dow = new Date(dday.key + "T00:00:00Z").getUTCDay();
    lines.push(`<b>${tx.days[dow]}</b>  ${esc(names.join(" · "))}`);
    shownKeys.push(dday.key);
  }
  if (lines.length === 0) throw new Error("Menyu retseptlari topilmadi");

  const range = weekRangeLabel(shownKeys, tx);
  let caption = `<b>${tx.menuTitle}</b>\n${esc(range)}\n\n${lines.join("\n")}\n\n${tx.menuCta}`;
  // Telegram caption limiti 1024 belgi
  while (caption.length > 1000 && lines.length > 1) {
    lines.pop();
    caption = `<b>${tx.menuTitle}</b>\n${esc(range)}\n\n${lines.join("\n")}\n\n${tx.menuCta}`;
  }
  return { caption, btn: tx.menuBtn };
}

async function savePrepared(userId, result) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/savePreparedInlineMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      result,
      allow_user_chats: true,
      allow_group_chats: true,
      allow_channel_chats: false,
      allow_bot_chats: false
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(`savePreparedInlineMessage: ${data.description || res.status}`);
  return data.result.id;
}

// kind: "recipe" | "referral". Qaytaradi: prepared message id
async function prepareShareMessage({ db, userId, kind, lang, recipeId, botUsername, menu }) {
  const base = baseUrl();
  if (!base) throw new Error("MINI_APP_URL sozlanmagan");

  if (kind === "recipe") {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(String(recipeId || ""))) throw new Error("recipeId noto'g'ri");
    const snap = await db.collection("recipes").doc(recipeId).get();
    if (!snap.exists) throw new Error("Retsept topilmadi");
    const recipe = snap.data();
    const link = `https://t.me/${botUsername}?start=recipe_${recipeId}`;
    const fallback = `${base}/${categoryImagePath(recipe.category)}`;
    const own = jpegUrlFor(recipe.imageUrl);
    let id = null;
    if (own) {
      try {
        id = await savePrepared(userId, buildResult({ kind, lang, link, recipe, recipeId, photoUrl: own }));
      } catch (err) {
        console.error("Retsept rasmi bilan tayyorlab bo'lmadi, brend rasmga o'tamiz:", err.message);
      }
    }
    if (!id) id = await savePrepared(userId, buildResult({ kind, lang, link, recipe, recipeId, photoUrl: fallback }));
    // Statistika: qaysi retsept ko'p ulashilmoqda (xato bo'lsa ulashishga halal bermaydi)
    try {
      const { FieldValue } = require("firebase-admin/firestore");
      await db.collection("recipes").doc(recipeId).set({ shareCount: FieldValue.increment(1) }, { merge: true });
    } catch (err) {
      console.error("shareCount yozilmadi:", err.message);
    }
    return id;
  }

  if (kind === "referral") {
    const link = `https://t.me/${botUsername}?start=ref_${userId}`;
    return savePrepared(userId, buildResult({ kind: "referral", lang, link, photoUrl: `${base}/${FALLBACK_IMAGE.invite}` }));
  }

  if (kind === "menu") {
    const link = `https://t.me/${botUsername}?start=ref_${userId}`;
    const { caption, btn } = await buildMenuCaption(db, menu, lang);
    return savePrepared(userId, {
      type: "photo",
      id: "menu",
      photo_url: `${base}/${FALLBACK_IMAGE.invite}`,
      thumbnail_url: `${base}/${FALLBACK_IMAGE.invite}`,
      caption,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: btn, url: link }]] }
    });
  }

  throw new Error("Noma'lum kind");
}

module.exports = { prepareShareMessage };
