/**
 * Converts prediction outputs into avatar states for 3D rendering.
 *
 * @param {Object} predictions - Prediction parameters
 * @param {number} predictions.stress_level - Stress percentage (0-100)
 * @param {number} predictions.wellbeing_score - Wellbeing score (0-100)
 * @param {number} predictions.dropout_risk - Dropout risk percentage (0-100)
 * @param {number} predictions.sleep_hours - Average sleep hours (0-10+)
 * @returns {{ state: "stressed" | "tired" | "burnout" | "normal" | "thriving", intensity: number }}
 */
export function getAvatarState({
  stress_level = 50,
  wellbeing_score = 50,
  dropout_risk = 0,
  sleep_hours = 7,
}) {
  // Normalize constraints
  const stress = Math.max(0, Math.min(100, stress_level));
  const wellbeing = Math.max(0, Math.min(100, wellbeing_score));
  const dropout = Math.max(0, Math.min(100, dropout_risk));
  const sleep = Math.max(0, Math.min(14, sleep_hours));

  // Determine state thresholds
  // Rule 2: Low wellbeing + high dropout = burnout
  // Rule 1: High stress + low sleep = burnout (extreme) or tired
  const isBurnout = (wellbeing <= 40 && dropout >= 60) || (stress >= 85 && sleep <= 4);
  const isTired = stress >= 60 && sleep <= 5;
  const isStressed = stress >= 65;
  // Rule 3: High wellbeing + low stress = thriving
  const isThriving = wellbeing >= 75 && stress <= 40;

  // Evaluate hierarchically from most severe to least
  if (isBurnout) {
    // Intensity is derived from how severe the factors are
    const intensity = Math.max(stress, dropout, 100 - wellbeing) / 100;
    return { state: 'burnout', intensity: Math.min(1, Math.max(0, intensity)) };
  }

  if (isTired) {
    // Punish intensity mainly on severe lack of sleep combined with stress
    const sleepDeficit = Math.max(0, (7 - sleep) * 10); // Extrapolate deficit to a 100-scale severity
    const intensity = Math.max(stress, sleepDeficit) / 100;
    return { state: 'tired', intensity: Math.min(1, Math.max(0, intensity)) };
  }

  if (isStressed) {
    // Intensity is purely stress-driven
    return { state: 'stressed', intensity: stress / 100 };
  }

  if (isThriving) {
    // True thriving scales up with ultra-high wellbeing
    return { state: 'thriving', intensity: wellbeing / 100 };
  }

  // Normal / Baseline
  return { state: 'normal', intensity: 0.5 };
}
