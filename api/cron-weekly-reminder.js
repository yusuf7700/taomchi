// ===== Ovqaty — Haftalik reja eslatmasi (qo'lda tekshirish uchun) =====
// DIQQAT: bu endpoint endi vercel.json'dagi "crons" ro'yxatida YO'Q —
// Vercel Hobby rejasi bitta loyihaga maksimal 2ta cron job'ga ruxsat
// beradi, shuning uchun bu logika kunlik (lunch) cron ichiga
// "yopishtirildi" (qarang: api/cron-daily-reminder.js va
// lib/weeklyReminder.js). Bu fayl faqat qo'lda (Postman/curl bilan,
// CRON_SECRET header'i bilan) sinab ko'rish uchun qoldirilgan.

const { getDb } = require("../lib/firebaseAdmin");
const { safeCompare } = require("../lib/safeCompare");
const { sendWeeklyReminders } = require("../lib/weeklyReminder");

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
    const result = await sendWeeklyReminders(db);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Haftalik eslatma xatosi:", err);
    return res.status(500).json({ error: err.message });
  }
};
