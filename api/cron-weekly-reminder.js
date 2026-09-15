// ===== Ovqaty — Haftalik reja eslatmasi (Vercel Cron orqali avtomatik) =====
// Har kuni ertalab (vercel.json'dagi jadval bo'yicha, Toshkent vaqti
// bilan 08:00) ishga tushadi. Faqat shu haftaga HALI HECH NARSA
// rejalashtirmagan foydalanuvchilarga yuboriladi — foydalanuvchi bir
// kun/ovqat qo'shishi bilanoq, keyingi kunlarda eslatma avtomatik
// to'xtaydi (ortiqcha bezovta qilinmaydi).
//
// Xavfsizlik: faqat Vercel Cron'ning o'zi chaqira oladi (CRON_SECRET
// muhit o'zgaruvchisi orqali tasdiqlanadi, boshqa hech kim emas).

const { getDb } = require("../lib/firebaseAdmin");
const { safeCompare } = require("../lib/safeCompare");
const bot = require("../bot/bot");
const { getCurrentMonday, dateKeyOf, LEGACY_DAY_ORDER } = require("../lib/weeklyMenuDates");

const TEXT = {
  uz: {
    body: "📅 Bu haftaga hali ovqat rejalashtirilmagan! Oldindan rejalashtiring — har kuni \"bugun nima pishiray\" deb o'ylamang.",
    btn: "🗓 Haftalik menyu"
  },
  uzk: {
    body: "📅 Бу ҳафтага ҳали овқат режалаштирилмаган! Олдиндан режалаштиринг — ҳар куни \"бугун нима пиширай\" деб ўйламанг.",
    btn: "🗓 Ҳафталик меню"
  }
};

// Joriy haftaning 7 ta sana-kalitini (dushanbadan boshlab) qaytaradi
function getCurrentWeekDateKeys() {
  const monday = getCurrentMonday();
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    keys.push(dateKeyOf(d));
  }
  return keys;
}

// Hujjatda joriy haftaga (sana yoki hali migratsiya qilinmagan
// kun-nomli kalitlar orqali) kamida bitta reja borligini tekshiradi
function hasAnyPlanThisWeek(days, weekDateKeys) {
  if (!days) return false;
  const hasDateKeyPlan = weekDateKeys.some(key => {
    const entry = days[key];
    return entry && (entry.lunch || entry.dinner);
  });
  if (hasDateKeyPlan) return true;
  // Eski (kun-nomli) format hali migratsiya qilinmagan bo'lishi mumkin —
  // bunday hujjat "shablon" sifatida doimiy amal qilgani uchun ham
  // "rejalashtirilgan" hisoblanadi.
  return LEGACY_DAY_ORDER.some(day => {
    const entry = days[day];
    return entry && (entry.lunch || entry.dinner);
  });
}

module.exports = async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!process.env.CRON_SECRET || !safeCompare(authHeader || "", `Bearer ${process.env.CRON_SECRET}`)) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "FIREBASE_SERVICE_ACCOUNT noto'g'ri: " + err.message });
  }

  try {
    const weekDateKeys = getCurrentWeekDateKeys();
    const [menusSnap, usersSnap] = await Promise.all([
      db.collection("weeklyMenus").get(),
      db.collection("users").get()
    ]);

    const menusById = new Map(menusSnap.docs.map(doc => [doc.id, doc.data()]));

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const user = userDoc.data();
      const legacyOff = user.notificationsEnabled === false;
      const weeklyOff = user.weeklyReminderEnabled !== undefined ? user.weeklyReminderEnabled === false : legacyOff;
      if (weeklyOff) { skipped++; continue; }

      const menu = menusById.get(userId);
      if (hasAnyPlanThisWeek(menu && menu.days, weekDateKeys)) { skipped++; continue; }

      const lang = user.language === "uzk" ? "uzk" : "uz";
      const tt = TEXT[lang];
      const url = `${process.env.MINI_APP_URL}/weekly-menu.html`;

      try {
        await bot.telegram.sendMessage(userId, tt.body, {
          reply_markup: { inline_keyboard: [[{ text: tt.btn, web_app: { url } }]] }
        });
        sent++;
      } catch {
        failed++; // bot bloklangan yoki chat topilmadi
      }
      await new Promise(resolve => setTimeout(resolve, 40)); // Telegram limitidan chiqmaslik uchun
    }

    return res.status(200).json({ week: weekDateKeys[0], sent, skipped, failed });
  } catch (err) {
    console.error("Haftalik eslatma xatosi:", err);
    return res.status(500).json({ error: err.message });
  }
};
