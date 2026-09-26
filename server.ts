import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// POST /api/extract-subscription
app.post('/api/extract-subscription', async (req, res) => {
  try {
    const { text, defaultCurrency = 'INR' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    if (!ai) {
      // Rule-based fallback if no Gemini API key
      const extracted = fallbackExtract(text, defaultCurrency);
      return res.json({ subscription: extracted, source: 'heuristic-fallback' });
    }

    const prompt = `You are a financial intelligence assistant in SubSense.
Extract structured subscription details from this user input:
"${text}"

Respond ONLY with a valid JSON object matching this schema (do NOT wrap with markdown backticks):
{
  "name": "string (e.g. Netflix, Spotify, Canva, AWS, Gym, YouTube)",
  "amount": number (numeric value only, e.g. 649 or 5000),
  "currency": "string (e.g. INR, USD, EUR. default is ${defaultCurrency})",
  "billingCycle": "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY",
  "category": "Entertainment" | "Music" | "Productivity" | "Cloud & DevOps" | "Fitness" | "Learning" | "Utilities" | "Other",
  "renewalDay": number | null (day of month, e.g. 12 or null if not stated),
  "startDate": "YYYY-MM-DD or null if not mentioned",
  "notes": "string summary or additional details"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : fallbackExtract(text, defaultCurrency);
    }

    // Validate and clean
    const subscription = {
      name: parsed.name || 'Untitled Subscription',
      amount: Number(parsed.amount) || 0,
      currency: parsed.currency || defaultCurrency,
      billingCycle: ['MONTHLY', 'YEARLY', 'WEEKLY', 'QUARTERLY'].includes(parsed.billingCycle)
        ? parsed.billingCycle
        : 'MONTHLY',
      category: parsed.category || 'Other',
      renewalDay: parsed.renewalDay ? Number(parsed.renewalDay) : 1,
      startDate: parsed.startDate || null,
      notes: parsed.notes || '',
    };

    return res.json({ subscription, source: 'gemini' });
  } catch (error: any) {
    console.error('Error in /api/extract-subscription:', error);
    // Graceful fallback
    const fallback = fallbackExtract(req.body.text || '', req.body.defaultCurrency || 'INR');
    return res.json({ subscription: fallback, source: 'fallback-after-error', warning: error.message });
  }
});

// POST /api/analyze-waste
app.post('/api/analyze-waste', async (req, res) => {
  try {
    const { subscriptions, totalMonthly, totalYearly, wasteCandidates, overlaps } = req.body;

    if (!ai) {
      return res.json({
        summary: `Your subscriptions total approximately ₹${totalYearly.toLocaleString()}/year across ${subscriptions.length} active services. Reviewing ${wasteCandidates.length} rarely used or high-cost items could save you up to ₹${Math.round(totalYearly * 0.3).toLocaleString()} annually.`,
        recommendations: [
          'Audit OTT overlaps to avoid paying for multiple services in the same month.',
          'Downgrade or pause subscriptions marked as rarely used.',
          'Switch frequent monthly subscriptions with annual discounts to yearly billing.',
        ],
        source: 'heuristic',
      });
    }

    const prompt = `You are SubSense's Subscription Intelligence Engine.
Analyze the user's current subscription portfolio and provide an objective, data-backed financial summary.
Do NOT sound preachy. Never command the user to cancel; highlight facts, usage patterns, and potential savings so they can make informed decisions.

Data:
- Total Subscriptions: ${subscriptions.length}
- Monthly Recurring Spend: ₹${totalMonthly}
- Yearly Projected Spend: ₹${totalYearly}
- Potentially Wasteful / Needing Review Candidates:
${JSON.stringify(wasteCandidates, null, 2)}
- Category Overlaps:
${JSON.stringify(overlaps, null, 2)}
- All Subscriptions:
${JSON.stringify(
  subscriptions.map((s: any) => ({
    name: s.name,
    amount: s.amount,
    cycle: s.billingCycle,
    annualCost: s.annualCost,
    category: s.category,
    usageFrequency: s.usageFrequency,
    daysSinceLastUsed: s.daysSinceLastUsed,
    status: s.status,
  })),
  null,
  2
)}

Respond in valid JSON only with this schema:
{
  "executiveSummary": "2-3 crisp sentences highlighting total annual cost, top cost drivers, and key items needing review.",
  "topSavingsPotential": number (estimated annual amount in INR they could save by reviewing or pausing inactive items),
  "insights": [
    "string: specific observation about usage vs cost",
    "string: specific observation about overlaps or upcoming renewals"
  ],
  "actionableSteps": [
    "string: step 1",
    "string: step 2",
    "string: step 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ ...parsed, source: 'gemini' });
  } catch (error: any) {
    console.error('Error in /api/analyze-waste:', error);
    return res.json({
      executiveSummary: `Your subscriptions cost approximately ₹${Number(req.body.totalYearly || 0).toLocaleString()} per year. Several subscriptions represent most of your recurring spending and have low recorded usage.`,
      topSavingsPotential: Math.round(Number(req.body.totalYearly || 0) * 0.25),
      insights: [
        'High cost recurring items marked as rarely used account for significant portion of annual spend.',
        'Multiple streaming services detected with overlapping content categories.',
      ],
      actionableSteps: [
        'Review subscriptions marked as inactive for more than 30 days.',
        'Consolidate duplicate category subscriptions.',
        'Set calendar alerts for annual renewals approaching in the next 7 days.',
      ],
      source: 'fallback',
    });
  }
});

// POST /api/query-subscriptions
app.post('/api/query-subscriptions', async (req, res) => {
  try {
    const { query, subscriptions, totalMonthly, totalYearly } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!ai) {
      return res.json({
        answer: `You currently have ${subscriptions.length} subscriptions totaling ₹${totalMonthly}/month (₹${totalYearly}/year).`,
        source: 'heuristic',
      });
    }

    const prompt = `You are SubSense Assistant. The user is asking a question about their active subscription records.
User Question: "${query}"

Subscription Database:
Total Monthly: ₹${totalMonthly}
Total Yearly: ₹${totalYearly}
Subscriptions:
${JSON.stringify(subscriptions, null, 2)}

Instructions:
1. Provide a direct, concise, friendly, and accurate answer based on the real data provided.
2. If asking about categories (like "entertainment" or "cloud"), aggregate the costs and list the relevant services with their amounts.
3. If asking about inactivity or renewals, mention exact days and amounts.
4. Keep the response concise (2-4 sentences max), formatted nicely with bold figures or bullet points if helpful.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      answer: response.text?.trim() || 'Here is your subscription summary.',
      source: 'gemini',
    });
  } catch (error: any) {
    console.error('Error in /api/query-subscriptions:', error);
    return res.json({
      answer: `You have ${req.body.subscriptions?.length || 0} subscriptions totaling ₹${req.body.totalMonthly || 0}/month.`,
      source: 'fallback',
    });
  }
});

// Heuristic fallback for extraction
function fallbackExtract(text: string, defaultCurrency: string) {
  const lower = text.toLowerCase();

  // Try to match popular service names
  const popularServices = [
    { name: 'Netflix', category: 'Entertainment' },
    { name: 'Spotify', category: 'Music' },
    { name: 'YouTube', category: 'Entertainment' },
    { name: 'Amazon Prime', category: 'Entertainment' },
    { name: 'Hotstar', category: 'Entertainment' },
    { name: 'Disney+', category: 'Entertainment' },
    { name: 'Canva', category: 'Productivity' },
    { name: 'Notion', category: 'Productivity' },
    { name: 'ChatGPT', category: 'Productivity' },
    { name: 'GitHub', category: 'Cloud & DevOps' },
    { name: 'AWS', category: 'Cloud & DevOps' },
    { name: 'Google One', category: 'Cloud & DevOps' },
    { name: 'Gym', category: 'Fitness' },
    { name: 'Cult.fit', category: 'Fitness' },
    { name: 'Coursera', category: 'Learning' },
    { name: 'Duolingo', category: 'Learning' },
  ];

  let matchedName = 'New Subscription';
  let matchedCategory = 'Other';
  for (const s of popularServices) {
    if (lower.includes(s.name.toLowerCase())) {
      matchedName = s.name;
      matchedCategory = s.category;
      break;
    }
  }

  // Extract amount (look for numbers, optionally with currency symbol or k)
  const amountMatch = text.match(/(?:₹|rs\.?|inr|\$|€|£)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)(?:\s*(?:k|thousand))?/i);
  let amount = 0;
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/,/g, '');
    amount = parseFloat(rawNum);
    if (text.toLowerCase().includes('k') && amount < 100) {
      amount *= 1000;
    }
  }

  // Billing cycle
  let billingCycle = 'MONTHLY';
  if (lower.includes('year') || lower.includes('annual') || lower.includes('/yr') || lower.includes('per annum')) {
    billingCycle = 'YEARLY';
  } else if (lower.includes('week')) {
    billingCycle = 'WEEKLY';
  } else if (lower.includes('quarter')) {
    billingCycle = 'QUARTERLY';
  }

  // Renewal day
  const dayMatch = text.match(/(?:renewal|renews|on the|due on)\s*(?:is\s*)?(\d{1,2})(?:st|nd|rd|th)?/i);
  const renewalDay = dayMatch ? Math.min(31, Math.max(1, parseInt(dayMatch[1], 10))) : 12;

  return {
    name: matchedName,
    amount: amount || 499,
    currency: defaultCurrency,
    billingCycle,
    category: matchedCategory,
    renewalDay,
    startDate: null,
    notes: 'Extracted from user prompt',
  };
}

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SubSense server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
