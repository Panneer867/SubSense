export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'QUARTERLY';

export type UsageFrequency = 'daily' | 'weekly' | 'moderate' | 'rare' | 'never';

export type WasteStatus = 'ACTIVE' | 'REVIEW' | 'HIGH_REVIEW' | 'OVERLAP' | 'RENEWING_SOON';

export type UserActionDecision = 'KEEP' | 'CANCEL' | 'DOWNGRADE' | 'PENDING';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  category: string;
  startDate?: string;
  renewalDay?: number; // 1-31
  nextRenewalDate?: string;
  lastUsedDate: string; // ISO date string
  usageFrequency: UsageFrequency;
  notes?: string;
  decision?: UserActionDecision;
  createdAt: string;
  // Computed fields by rules engine:
  annualCost?: number;
  monthlyEquivalent?: number;
  daysSinceLastUsed?: number;
  daysUntilRenewal?: number;
  status?: WasteStatus;
  statusReasons?: string[];
  overlapsWith?: string[];
  healthScore?: number; // 0 - 100
}

export interface WasteAnalysisResult {
  executiveSummary: string;
  topSavingsPotential: number;
  insights: string[];
  actionableSteps: string[];
  source?: 'gemini' | 'heuristic' | 'fallback';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  suggestedAction?: string;
}
