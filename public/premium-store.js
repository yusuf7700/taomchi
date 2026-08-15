// ===== Taomchi — Premium trial (hozircha qurilmada, keyin backend'ga ko'chadi) =====

const PREMIUM_UNTIL_KEY = "taomchi_premium_until";
const TRIAL_USED_KEY = "taomchi_trial_used";

function startPremiumTrial() {
  const until = Date.now() + 7 * 24 * 60 * 60 * 1000;
  localStorage.setItem(PREMIUM_UNTIL_KEY, String(until));
  localStorage.setItem(TRIAL_USED_KEY, "1");
}

function getPremiumStatus() {
  const until = Number(localStorage.getItem(PREMIUM_UNTIL_KEY) || 0);
  const active = until > Date.now();
  const daysLeft = active ? Math.ceil((until - Date.now()) / (24 * 60 * 60 * 1000)) : 0;
  const trialUsed = localStorage.getItem(TRIAL_USED_KEY) === "1";
  return { active, daysLeft, trialUsed };
}
