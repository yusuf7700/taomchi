// ===== Taomchi — Premium obuna API =====
// GET  /api/premium?initData=...                                  -> joriy Premium holati
// POST /api/premium  body: { initData, action: "claim_trial" }     -> 3 kunlik bepul sovg'ani olish
// POST /api/premium  body: { initData, action: "create_invoice",
//                             plan: "monthly"|"yearly" }            -> Stars invoice havolasi

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");
const { getPremiumStatus, claimPremiumTrial, planStarsPrice } = require("../lib/premium");
const { getReferralStatus } = require("../lib/referral");

module.exports = async (req, res) => {
  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko'ring." });
  }

  try {
    if (req.method === "GET") {
      const tgUser = verifyTelegramInitData(req.query.initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      // Retsept kontenti (ingredientlar, tayyorlash tartibi, video) — faqat
      // shu yerdan, tekshiruvdan o'tgandan keyin beriladi. Bu Premium
      // kontentni to'g'ridan-to'g'ri Firestore orqali o'qib olishning
      // (paywall'ni chetlab o'tishning) oldini oladi.
      if (req.query.recipeId) {
        const recipeDoc = await db.collection("recipes").doc(String(req.query.recipeId)).get();
        if (!recipeDoc.exists) return res.status(404).json({ error: "Retsept topilmadi" });
        const recipe = recipeDoc.data();

        if (recipe.isPremium === true) {
          const [premiumStatus, referralStatus] = await Promise.all([
            getPremiumStatus(db, tgUser.id),
            getReferralStatus(db, tgUser.id)
          ]);
          const unlocked = (referralStatus.unlockedRecipes || []).includes(String(req.query.recipeId));
          if (!premiumStatus.active && !unlocked) {
            return res.status(403).json({ error: "locked" });
          }
        }

        const contentDoc = await db.collection("recipeContent").doc(String(req.query.recipeId)).get();
        return res.status(200).json(contentDoc.exists ? contentDoc.data() : {});
      }

      const status = await getPremiumStatus(db, tgUser.id);
      return res.status(200).json(status);
    }

    if (req.method === "POST") {
      const { initData, action, plan } = req.body || {};
      const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      if (action === "claim_trial") {
        const result = await claimPremiumTrial(db, tgUser.id);
        if (!result.success) return res.status(400).json({ error: result.reason });
        return res.status(200).json({ success: true });
      }

      if (action === "create_invoice") {
        const selectedPlan = plan === "yearly" ? "yearly" : "monthly";
        const bot = require("../bot/bot");
        const link = await bot.telegram.createInvoiceLink({
          title: selectedPlan === "yearly" ? "Taomchi Premium — 1 yil" : "Taomchi Premium — 1 oy",
          description: "Kuniga 15 marta AI'dan so'rash va boshqa Premium imkoniyatlar",
          payload: `premium_${selectedPlan}_${tgUser.id}`,
          provider_token: "", // Telegram Stars uchun bo'sh qoldiriladi
          currency: "XTR",
          prices: [{ label: "Taomchi Premium", amount: planStarsPrice(selectedPlan) }]
        });
        return res.status(200).json({ link });
      }

      return res.status(400).json({ error: "Noma'lum action" });
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error("Premium API xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko'ring." });
  }
};
