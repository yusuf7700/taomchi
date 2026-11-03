// ===== Ovqaty — Telegram "tayyorlangan xabar" (rasm + sarlavha + tugma) =====
// Mini App'dan retsept yoki referal havolasini ulashganda oddiy matn o'rniga
// rasmli, tugmali xabar yuborish uchun: Bot API savePreparedInlineMessage -> id,
// keyin klientda Telegram.WebApp.shareMessage(id).
// Rasm: retsept rasmi (JPEG bo'lsa) yoki public/share/*.jpg dagi brend rasmi.

// Rasm yangilanganda fayl nomini o'zgartiring (-3, -4...): Telegram rasmni URL bo'yicha keshlaydi
const FALLBACK_IMAGE = { invite: "share/invite-2.jpg" };
// Retsept o'z rasmiga ega bo'lmasa — kategoriyasiga mos brend rasm (public/share/cat/<kategoriya>.jpg)
const CATEGORY_IMAGES = new Set(["main", "soup", "salad", "breakfast", "dessert", "pastry", "drinks", "diet"]);
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
    diff: { oson: "Oson", orta: "O'rta", qiyin: "Qiyin" }
  },
  uzk: {
    inviteTitle: "Музлатгичдагини ёзинг, таом тайёр",
    inviteBody: "Ovqaty — «нима пиширсам экан?» саволига ечим. Қўлингиздаги маҳсулотларни ёзинг, AI ошпаз мос таом ва рецептни топиб беради. Ҳафталик меню ҳам шу ерда.",
    inviteCta: "Қўшилинг 👇",
    inviteBtn: "Иловани очиш",
    recipeCta: "Тўлиқ рецепт, масаллиқлар ва тайёрлаш усули — Ovqaty иловасида 👇",
    recipeBtn: "Рецептни очиш",
    units: { daqiqa: "дақиқа", soat: "соат" },
    diff: { oson: "Осон", orta: "Ўрта", qiyin: "Қийин" }
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
    caption = `<b>🍲 ${esc(title)}</b>\n${meta ? meta + "\n" : ""}\n${tx.recipeCta}`;
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
async function prepareShareMessage({ db, userId, kind, lang, recipeId, botUsername }) {
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
    if (own) {
      try {
        return await savePrepared(userId, buildResult({ kind, lang, link, recipe, recipeId, photoUrl: own }));
      } catch (err) {
        console.error("Retsept rasmi bilan tayyorlab bo'lmadi, brend rasmga o'tamiz:", err.message);
      }
    }
    return savePrepared(userId, buildResult({ kind, lang, link, recipe, recipeId, photoUrl: fallback }));
  }

  if (kind === "referral") {
    const link = `https://t.me/${botUsername}?start=ref_${userId}`;
    return savePrepared(userId, buildResult({ kind: "referral", lang, link, photoUrl: `${base}/${FALLBACK_IMAGE.invite}` }));
  }

  throw new Error("Noma'lum kind");
}

module.exports = { prepareShareMessage };
