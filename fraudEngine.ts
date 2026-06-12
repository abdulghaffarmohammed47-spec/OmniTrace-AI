import { Transaction, FraudScore, RuleResult } from './types';

// ────────────────────────────────────────────────
// Part A: Expert Rule-Based Engine
// ────────────────────────────────────────────────

interface RuleInput {
  amount: number;
  hour: number;
  cardAge: number;
  velocity: number; // transactions per minute
  distanceKm: number; // travel distance between recent transactions
  timeBetweenTxns: number; // minutes
  sharedDeviceCount: number;
  sharedIPCount: number;
}

function evaluateRules(input: RuleInput): RuleResult[] {
  const results: RuleResult[] = [];

  // Rule 1: High-value midnight transaction
  const r1 = input.amount > 10000 && (input.hour >= 0 && input.hour < 5);
  results.push({
    rule: 'High-Value Midnight',
    triggered: r1,
    contribution: r1 ? 40 : 0,
    description: `Amount > $10,000 at ${input.hour}:00 (midnight window). ${r1 ? '⚠️ +40% risk' : '✅ Clear'}`,
  });

  // Rule 2: Velocity spike
  const r2 = input.velocity > 3;
  results.push({
    rule: 'Velocity Spike',
    triggered: r2,
    contribution: r2 ? 35 : 0,
    description: `${input.velocity.toFixed(1)} txns/min detected. ${r2 ? '⚠️ +35% risk (>3/min threshold)' : '✅ Normal velocity'}`,
  });

  // Rule 3: Impossible travel
  const r3 = input.distanceKm > 500 && input.timeBetweenTxns < 60;
  results.push({
    rule: 'Impossible Travel',
    triggered: r3,
    contribution: r3 ? 45 : 0,
    description: `${input.distanceKm.toFixed(0)}km in ${input.timeBetweenTxns.toFixed(0)} min. ${r3 ? '⚠️ +45% risk (physically impossible)' : '✅ Plausible travel'}`,
  });

  // Rule 4: New card high spend
  const r4 = input.cardAge < 3 && input.amount > 3000;
  results.push({
    rule: 'New Card High Spend',
    triggered: r4,
    contribution: r4 ? 25 : 0,
    description: `Card age: ${input.cardAge} months, amount: $${input.amount.toFixed(0)}. ${r4 ? '⚠️ +25% risk' : '✅ Normal'}`,
  });

  // Rule 5: Shared device cluster
  const r5 = input.sharedDeviceCount > 3;
  results.push({
    rule: 'Device Sharing Anomaly',
    triggered: r5,
    contribution: r5 ? 20 : 0,
    description: `${input.sharedDeviceCount} accounts on same device. ${r5 ? '⚠️ +20% risk' : '✅ Normal'}`,
  });

  // Rule 6: Shared IP cluster
  const r6 = input.sharedIPCount > 4;
  results.push({
    rule: 'IP Cluster Alert',
    triggered: r6,
    contribution: r6 ? 15 : 0,
    description: `${input.sharedIPCount} accounts on same IP. ${r6 ? '⚠️ +15% risk' : '✅ Normal'}`,
  });

  // Rule 7: Large round amount
  const r7 = input.amount >= 5000 && input.amount % 1000 === 0;
  results.push({
    rule: 'Round Amount Indicator',
    triggered: r7,
    contribution: r7 ? 10 : 0,
    description: `$${input.amount} is a round number ≥$5000. ${r7 ? '⚠️ +10% risk (structuring indicator)' : '✅ Normal'}`,
  });

  return results;
}

// ────────────────────────────────────────────────
// Part B: ML-like Scoring Pipeline (simulated)
// Uses a weighted feature scoring model that mimics
// Random Forest / Logistic Regression behavior
// ────────────────────────────────────────────────

interface MLFeatures {
  normalizedAmount: number;
  hourRisk: number;
  cardAgeRisk: number;
  velocityRisk: number;
  travelRisk: number;
  deviceClusterRisk: number;
  ipClusterRisk: number;
}

function extractMLFeatures(input: RuleInput): MLFeatures {
  return {
    normalizedAmount: Math.min(1, input.amount / 20000),
    hourRisk: (input.hour >= 0 && input.hour < 5) ? 0.8 : (input.hour >= 22 ? 0.4 : 0.1),
    cardAgeRisk: Math.max(0, 1 - input.cardAge / 24),
    velocityRisk: Math.min(1, input.velocity / 5),
    travelRisk: input.distanceKm > 500 && input.timeBetweenTxns < 60
      ? Math.min(1, input.distanceKm / 10000)
      : 0,
    deviceClusterRisk: Math.min(1, input.sharedDeviceCount / 6),
    ipClusterRisk: Math.min(1, input.sharedIPCount / 8),
  };
}

function mlPredict(features: MLFeatures): number {
  // Weighted ensemble model (simulating trained Random Forest)
  const weights = {
    normalizedAmount: 0.20,
    hourRisk: 0.12,
    cardAgeRisk: 0.15,
    velocityRisk: 0.22,
    travelRisk: 0.18,
    deviceClusterRisk: 0.07,
    ipClusterRisk: 0.06,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (features[key as keyof MLFeatures] || 0) * weight;
  }

  // Non-linear activation (sigmoid-like transform)
  const activated = 1 / (1 + Math.exp(-6 * (score - 0.35)));
  return Math.min(1, Math.max(0, activated));
}

// ────────────────────────────────────────────────
// Combined Fraud Risk Index
// ────────────────────────────────────────────────

export function calculateFraudScore(
  amount: number,
  hour: number,
  cardAge: number,
  velocity: number = 0.5,
  distanceKm: number = 0,
  timeBetweenTxns: number = 120,
  sharedDeviceCount: number = 1,
  sharedIPCount: number = 1
): FraudScore {
  const input: RuleInput = {
    amount, hour, cardAge, velocity,
    distanceKm, timeBetweenTxns,
    sharedDeviceCount, sharedIPCount,
  };

  // Rule-based scoring
  const ruleResults = evaluateRules(input);
  const ruleScoreRaw = ruleResults.reduce((sum, r) => sum + r.contribution, 0);
  const ruleScore = Math.min(100, ruleScoreRaw);

  // ML scoring
  const features = extractMLFeatures(input);
  const mlScoreRaw = mlPredict(features);
  const mlScore = Math.round(mlScoreRaw * 100);

  // Combined: 55% ML + 45% Rules (industry-standard hybrid weighting)
  const combined = Math.round(0.55 * mlScore + 0.45 * ruleScore);
  const combinedClamped = Math.min(100, Math.max(0, combined));

  let classification: FraudScore['classification'];
  if (combinedClamped >= 75) classification = 'CRITICAL';
  else if (combinedClamped >= 50) classification = 'HIGH';
  else if (combinedClamped >= 25) classification = 'MEDIUM';
  else classification = 'LOW';

  return {
    ruleScore,
    mlScore,
    combinedScore: combinedClamped,
    ruleDetails: ruleResults,
    mlFeatures: features as unknown as Record<string, number>,
    classification,
  };
}

export function scoreTransaction(txn: Transaction, allTxns: Transaction[]): FraudScore {
  const hour = new Date(txn.timestamp).getHours();

  // Calculate velocity
  const userTxns = allTxns.filter(t => t.userId === txn.userId);
  const recentTxns = userTxns.filter(t =>
    Math.abs(t.timestamp - txn.timestamp) < 60000 && t.id !== txn.id
  );
  const velocity = recentTxns.length + 1;

  // Calculate travel distance
  let distanceKm = 0;
  let timeBetween = 120;
  const prevTxn = userTxns
    .filter(t => t.timestamp < txn.timestamp)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  if (prevTxn) {
    distanceKm = haversineDistance(prevTxn.lat, prevTxn.lng, txn.lat, txn.lng);
    timeBetween = (txn.timestamp - prevTxn.timestamp) / 60000;
  }

  // Count shared devices/IPs
  const sharedDevice = new Set(allTxns.filter(t => t.deviceId === txn.deviceId).map(t => t.userId)).size;
  const sharedIP = new Set(allTxns.filter(t => t.ipAddress === txn.ipAddress).map(t => t.userId)).size;

  return calculateFraudScore(
    txn.amount, hour, txn.cardAge,
    velocity, distanceKm, timeBetween,
    sharedDevice, sharedIP
  );
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
