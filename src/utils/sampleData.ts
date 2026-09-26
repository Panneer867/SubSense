import { Subscription } from '../types/subscription';

const now = new Date();
const daysAgo = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    name: 'Netflix',
    amount: 649,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    category: 'Entertainment',
    renewalDay: 12,
    lastUsedDate: daysAgo(21),
    usageFrequency: 'rare',
    notes: 'Premium 4K plan. Rarely watched this month.',
    decision: 'PENDING',
    createdAt: '2025-01-10',
  },
  {
    id: 'sub-2',
    name: 'Spotify',
    amount: 119,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    category: 'Music',
    renewalDay: 4,
    lastUsedDate: daysAgo(0), // Today
    usageFrequency: 'daily',
    notes: 'Daily commute playlists & podcasts.',
    decision: 'KEEP',
    createdAt: '2024-06-15',
  },
  {
    id: 'sub-3',
    name: 'AWS Cloud',
    amount: 800,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    category: 'Cloud & DevOps',
    renewalDay: 1,
    lastUsedDate: daysAgo(3),
    usageFrequency: 'moderate',
    notes: 'EC2 & S3 personal projects sandbox.',
    decision: 'KEEP',
    createdAt: '2024-11-01',
  },
  {
    id: 'sub-4',
    name: 'Notion Plus',
    amount: 400,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    category: 'Productivity',
    renewalDay: 18,
    lastUsedDate: daysAgo(38), // Inactive > 30 days
    usageFrequency: 'rare',
    notes: 'Migrated notes to Obsidian last month, still paying.',
    decision: 'PENDING',
    createdAt: '2024-03-12',
  },
  {
    id: 'sub-5',
    name: 'Gym Membership',
    amount: 1500,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    category: 'Fitness',
    renewalDay: 28,
    lastUsedDate: daysAgo(42), // Inactive 42 days, high cost!
    usageFrequency: 'rare',
    notes: 'Neighborhood fitness center access card.',
    decision: 'PENDING',
    createdAt: '2024-08-01',
  },
  {
    id: 'sub-6',
    name: 'YouTube Premium',
    amount: 129,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    category: 'Entertainment',
    renewalDay: 15,
    lastUsedDate: daysAgo(16),
    usageFrequency: 'moderate',
    notes: 'Ad-free video on smart TV and tablet.',
    decision: 'KEEP',
    createdAt: '2024-05-20',
  },
  {
    id: 'sub-7',
    name: 'Canva Pro',
    amount: 5000,
    currency: 'INR',
    billingCycle: 'YEARLY',
    category: 'Productivity',
    renewalDay: new Date(Date.now() + 4 * 86400000).getDate(), // Renews in 4 days!
    lastUsedDate: daysAgo(48), // Inactive > 30 days
    usageFrequency: 'rare',
    notes: 'Purchased for presentation design last year, rarely opened since.',
    decision: 'PENDING',
    createdAt: '2025-10-01',
  },
  {
    id: 'sub-8',
    name: 'Amazon Prime',
    amount: 299,
    currency: 'INR',
    billingCycle: 'MONTHLY',
    category: 'Entertainment',
    renewalDay: 9,
    lastUsedDate: daysAgo(8),
    usageFrequency: 'weekly',
    notes: 'Shopping shipping benefits + Prime Video streaming.',
    decision: 'KEEP',
    createdAt: '2024-01-05',
  },
];
