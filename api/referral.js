// ===== Taomchi — Referal API =====
// GET  /api/referral?initData=...                                    -> ball holati + referal havola
// POST /api/referral  body: { initData, action: "redeem_recipe",
//                              recipeId }                             -> ball evaziga retseptni ochish

const { getDb } = require("../lib/firebaseAdmin");
const { verifyTelegramInitData } = require("../lib/verifyTelegramInitData");
const { getReferralStatus, redeemRecipeUnlock, redeemAiBonus, redeemPremiumDays, PREMIUM_3D_DAYS, PREMIUM_3D_COST, PREMIUM_30D_DAYS, PREMIUM_30D_COST } = require("../lib/referral");

let cachedBotUsername = null;
async function getBotUsername() {
  if (cachedBotUsername) return cachedBotUsername;
  const bot = require("../bot/bot");
  const me = await bot.telegram.getMe();
  cachedBotUsername = me.username;
  return cachedBotUsername;
}

module.exports = async (req, res) => {
  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error("Firebase Admin xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko''ring." });
  }

  try {
    if (req.method === "GET") {
      const tgUser = verifyTelegramInitData(req.query.initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      const [status, botUsername] = await Promise.all([
        getReferralStatus(db, tgUser.id),
        getBotUsername().catch(() => null)
      ]);

      return res.status(200).json({
        ...status,
        referralLink: botUsername ? `https://t.me/${botUsername}?start=ref_${tgUser.id}` : null
      });
    }

    if (req.method === "POST") {
      const { initData, action, recipeId, rewardType } = req.body || {};
      const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
      if (!tgUser) return res.status(401).json({ error: "Noto'g'ri yoki eskirgan initData" });

      if (action === "redeem_recipe") {
        if (!recipeId) return res.status(400).json({ error: "recipeId kerak" });
        const result = await redeemRecipeUnlock(db, tgUser.id, recipeId);
        if (!result.success) return res.status(400).json({ error: result.reason });
        return res.status(200).json({ success: true, remainingPoints: result.remainingPoints });
      }

      if (action === "redeem_reward") {
        let result;
        if (rewardType === "ai_bonus") {
          result = await redeemAiBonus(db, tgUser.id);
        } else if (rewardType === "premium_3d") {
          result = await redeemPremiumDays(db, tgUser.id, PREMIUM_3D_DAYS, PREMIUM_3D_COST);
        } else if (rewardType === "premium_30d") {
          result = await redeemPremiumDays(db, tgUser.id, PREMIUM_30D_DAYS, PREMIUM_30D_COST);
        } else {
          return res.status(400).json({ error: "Noma'lum rewardType" });
        }

        if (!result.success) return res.status(400).json({ error: result.reason });
        return res.status(200).json({ success: true, remainingPoints: result.remainingPoints });
      }

      return res.status(400).json({ error: "Noma'lum action" });
    }

    return res.status(405).json({ error: "Usul qo'llab-quvvatlanmaydi" });
  } catch (err) {
    console.error("Referral API xatosi:", err);
    return res.status(500).json({ error: "Server xatosi. Birozdan keyin urinib ko''ring." });
  }
};
