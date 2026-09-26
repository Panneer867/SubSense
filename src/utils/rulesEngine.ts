import { Subscription, WasteStatus } from '../types/subscription';

export function calculateMonthlyEquivalent(amount: number, cycle: string): number {
  switch (cycle) {
    case 'YEARLY':
      return Math.round((amount / 12) * 100) / 100;
    case 'QUARTERLY':
      return Math.round((amount / 3) * 100) / 100;
    case 'WEEKLY':
      return Math.round(amount * 4.33 * 100) / 100;
    case 'MONTHLY':
    default:
      return amount;
  }
}

export function calculateAnnualCost(amount: number, cycle: string): number {
  switch (cycle) {
    case 'YEARLY':
      return amount;
    case 'QUARTERLY':
      return amount * 4;
    case 'WEEKLY':
      return Math.round(amount * 52);
    case 'MONTHLY':
    default:
      return amount * 12;
  }
}

export function getDaysSince(dateStr: string): number {
  if (!dateStr) return 999;
  const now = new Date();
  const past = new Date(dateStr);
  const diffTime = Math.max(0, now.getTime() - past.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getNextRenewalDate(renewalDay?: number, billingCycle: string = 'MONTHLY'): { nextDate: string; daysUntil: number } {
  const now = new Date();
  const targetDay = renewalDay && renewalDay >= 1 && renewalDay <= 31 ? renewalDay : 1;
  
  const candidate = new Date(now.getFullYear(), now.getMonth(), targetDay);
  if (candidate.getTime() < now.getTime()) {
    // Next month
    candidate.setMonth(candidate.getMonth() + 1);
  }
  
  const diffTime = candidate.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  return {
    nextDate: candidate.toISOString().split('T')[0],
    daysUntil,
  };
}

export function evaluateSubscriptions(subscriptions: Subscription[]): Subscription[] {
  // First pass: identify category groups for overlap detection
  const categoryMap = new Map<string, string[]>();
  subscriptions.forEach(s => {
    const list = categoryMap.get(s.category) || [];
    list.push(s.name);
    categoryMap.set(s.category, list);
  });

  return subscriptions.map(sub => {
    const monthlyEquivalent = calculateMonthlyEquivalent(sub.amount, sub.billingCycle);
    const annualCost = calculateAnnualCost(sub.amount, sub.billingCycle);
    const daysSinceLastUsed = getDaysSince(sub.lastUsedDate);
    const { nextDate, daysUntil } = getNextRenewalDate(sub.renewalDay, sub.billingCycle);

    const statusReasons: string[] = [];
    const overlapsWith: string[] = [];
    let status: WasteStatus = 'ACTIVE';
    let baseScore = 100;

    // Rule 1: Long inactivity (> 30 days)
    if (daysSinceLastUsed > 30) {
      status = 'REVIEW';
      statusReasons.push(`No usage recorded in ${daysSinceLastUsed} days`);
      baseScore -= 35;
    }

    // Rule 2: High cost + low usage (monthly > ₹500 and usage is rare/never)
    if (monthlyEquivalent >= 500 && (sub.usageFrequency === 'rare' || sub.usageFrequency === 'never')) {
      status = 'HIGH_REVIEW';
      statusReasons.push(`High cost (₹${monthlyEquivalent}/mo) with low frequency`);
      baseScore -= 45;
    }

    // Rule 3: Category overlap
    const categoryPeers = categoryMap.get(sub.category) || [];
    if (categoryPeers.length > 1 && ['Entertainment', 'Music', 'Cloud & DevOps', 'Productivity'].includes(sub.category)) {
      const otherPeers = categoryPeers.filter(name => name.toLowerCase() !== sub.name.toLowerCase());
      if (otherPeers.length > 0) {
        overlapsWith.push(...otherPeers);
        statusReasons.push(`Category overlap with ${otherPeers.join(', ')}`);
        baseScore -= 15;
        if (status === 'ACTIVE') {
          status = 'OVERLAP';
        }
      }
    }

    // Rule 4: Renewal approaching in 7 days
    if (daysUntil <= 7) {
      statusReasons.push(`Renews in ${daysUntil === 0 ? 'today' : daysUntil + ' days'}`);
      if (status === 'REVIEW' || status === 'HIGH_REVIEW') {
        // High priority review because money is about to be charged!
        statusReasons.push(`Renewal imminent! Review before card is charged.`);
      }
    }

    // Adjust health score by usage frequency
    if (sub.usageFrequency === 'daily') baseScore += 10;
    else if (sub.usageFrequency === 'weekly') baseScore += 5;
    else if (sub.usageFrequency === 'rare') baseScore -= 15;
    else if (sub.usageFrequency === 'never') baseScore -= 30;

    // Cap score between 10 and 100
    const healthScore = Math.max(10, Math.min(100, baseScore));

    return {
      ...sub,
      monthlyEquivalent,
      annualCost,
      daysSinceLastUsed,
      daysUntilRenewal: daysUntil,
      nextRenewalDate: nextDate,
      status,
      statusReasons,
      overlapsWith,
      healthScore,
    };
  });
}

export function computePortfolioStats(subscriptions: Subscription[]) {
  const evaluated = evaluateSubscriptions(subscriptions);

  const totalMonthly = Math.round(evaluated.reduce((acc, s) => acc + (s.monthlyEquivalent || 0), 0));
  const totalYearly = Math.round(evaluated.reduce((acc, s) => acc + (s.annualCost || 0), 0));

  const needsReview = evaluated.filter(s => s.status === 'REVIEW' || s.status === 'HIGH_REVIEW');
  const renewingSoon = evaluated.filter(s => (s.daysUntilRenewal || 0) <= 7);
  const overlaps = evaluated.filter(s => (s.overlapsWith && s.overlapsWith.length > 0));

  // Potential waste calculation: full annual cost of high review items + 60% of review items
  const potentialWaste = Math.round(
    evaluated.reduce((sum, s) => {
      if (s.status === 'HIGH_REVIEW') return sum + (s.annualCost || 0);
      if (s.status === 'REVIEW') return sum + (s.annualCost || 0) * 0.6;
      return sum;
    }, 0)
  );

  const avgHealthScore = evaluated.length > 0
    ? Math.round(evaluated.reduce((sum, s) => sum + (s.healthScore || 50), 0) / evaluated.length)
    : 100;

  return {
    evaluated,
    totalMonthly,
    totalYearly,
    activeCount: evaluated.length,
    needsReviewCount: needsReview.length,
    renewingSoonCount: renewingSoon.length,
    overlapCount: overlaps.length,
    potentialWaste,
    avgHealthScore,
  };
}
