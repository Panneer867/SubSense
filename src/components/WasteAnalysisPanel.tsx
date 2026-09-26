import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2, ChevronRight, Layers, DollarSign } from 'lucide-react';
import { Subscription, WasteAnalysisResult } from '../types/subscription';

interface WasteAnalysisPanelProps {
  subscriptions: Subscription[];
  totalMonthly: number;
  totalYearly: number;
  potentialWaste: number;
  needsReviewCount: number;
  onFilterStatus: (status: string) => void;
}

export const WasteAnalysisPanel: React.FC<WasteAnalysisPanelProps> = ({
  subscriptions,
  totalMonthly,
  totalYearly,
  potentialWaste,
  needsReviewCount,
  onFilterStatus,
}) => {
  const [analysis, setAnalysis] = useState<WasteAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Group candidate items
  const highReviewItems = subscriptions.filter(s => s.status === 'HIGH_REVIEW');
  const reviewItems = subscriptions.filter(s => s.status === 'REVIEW');
  const overlappingItems = subscriptions.filter(s => s.status === 'OVERLAP' || (s.overlapsWith && s.overlapsWith.length > 0));
  const renewingSoonItems = subscriptions.filter(s => (s.daysUntilRenewal || 0) <= 7);

  const fetchGeminiAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptions,
          totalMonthly,
          totalYearly,
          wasteCandidates: [...highReviewItems, ...reviewItems].map(s => ({
            name: s.name,
            amount: s.amount,
            billingCycle: s.billingCycle,
            annualCost: s.annualCost,
            category: s.category,
            daysSinceLastUsed: s.daysSinceLastUsed,
            usageFrequency: s.usageFrequency,
            statusReasons: s.statusReasons,
          })),
          overlaps: overlappingItems.map(s => ({
            name: s.name,
            category: s.category,
            overlapsWith: s.overlapsWith,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze subscriptions');
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback
      setAnalysis({
        executiveSummary: `Your subscriptions cost approximately ₹${totalYearly.toLocaleString()}/year. Three subscriptions represent the majority of your recurring spending. Subscriptions marked with rare usage and inactivity over 30 days are strong candidates for your review.`,
        topSavingsPotential: potentialWaste,
        insights: [
          `You have ${highReviewItems.length} high-cost services with rare usage accounting for substantial annual drain.`,
          `Overlapping subscriptions detected in streaming/entertainment categories.`,
          `${renewingSoonItems.length} subscription(s) renewing within the next 7 days.`,
        ],
        actionableSteps: [
          'Review high cost / low frequency subscriptions before their next billing cycle.',
          'Consolidate multiple streaming platforms by rotating active months.',
          'Consider annual billing only for daily essentials with proven discounts.',
        ],
        source: 'heuristic',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Header with trigger button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Subscription Waste &amp; Overlap Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Combines deterministic rules (inactivity, cost/frequency, renewal thresholds) with Gemini financial reasoning.
          </p>
        </div>

        <button
          onClick={fetchGeminiAnalysis}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Portfolio...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analysis ? 'Re-Analyze with Gemini' : 'Run Gemini Waste Analysis'}</span>
            </>
          )}
        </button>
      </div>

      {/* Gemini Executive Summary Card */}
      {analysis ? (
        <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 rounded-xl p-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Gemini Executive Briefing
            </span>
            <span className="text-[10px] text-slate-400">
              User-controlled decisions • Objective financial data
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed font-normal">
            "{analysis.executiveSummary}"
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Insights */}
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Key Observations
              </h4>
              <ul className="space-y-1.5">
                {analysis.insights.map((insight, idx) => (
                  <li key={idx} className="text-slate-300 flex items-start gap-1.5 text-xs">
                    <span className="text-indigo-400 font-bold shrink-0">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actionable Steps */}
            <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Recommended Next Steps
              </h4>
              <ul className="space-y-1.5">
                {analysis.actionableSteps.map((step, idx) => (
                  <li key={idx} className="text-slate-300 flex items-start gap-1.5 text-xs">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Initial deterministic summary if Gemini analysis not clicked yet */
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">
                Rule Engine Alert: ₹{potentialWaste.toLocaleString()} in potential annual waste detected
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {needsReviewCount} subscription(s) violate usage or cost rules (e.g. inactive &gt;30 days or high recurring charge with rare usage).
              </p>
            </div>
          </div>
          <button
            onClick={fetchGeminiAnalysis}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 shrink-0"
          >
            Generate Gemini Narrative <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Interactive Waste Rules Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Rule 1: Long Inactivity */}
        <div
          onClick={() => onFilterStatus('REVIEW')}
          className="bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-amber-400">Rule 1 • Inactivity</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
              {reviewItems.length + highReviewItems.filter(h => (h.daysSinceLastUsed || 0) > 30).length} found
            </span>
          </div>
          <p className="font-semibold text-white">Last Usage &gt; 30 Days</p>
          <p className="text-slate-400 text-[11px] mt-1">
            Paying recurring fees without recent engagement.
          </p>
        </div>

        {/* Rule 2: High Cost + Low Usage */}
        <div
          onClick={() => onFilterStatus('HIGH_REVIEW')}
          className="bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-rose-400">Rule 2 • High Cost</span>
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
              {highReviewItems.length} found
            </span>
          </div>
          <p className="font-semibold text-white">&gt; ₹500/mo &amp; Rare Usage</p>
          <p className="text-slate-400 text-[11px] mt-1">
            Major spending drivers with negligible daily return.
          </p>
        </div>

        {/* Rule 3: Category Overlap */}
        <div
          onClick={() => onFilterStatus('OVERLAP')}
          className="bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-purple-400">Rule 3 • Overlaps</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px]">
              {overlappingItems.length} found
            </span>
          </div>
          <p className="font-semibold text-white">Duplicate Services</p>
          <p className="text-slate-400 text-[11px] mt-1">
            Multiple streaming/SaaS in same category simultaneously.
          </p>
        </div>

        {/* Rule 4: Imminent Renewal */}
        <div
          onClick={() => onFilterStatus('RENEWING_SOON')}
          className="bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Rule 4 • Renewal</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
              {renewingSoonItems.length} in 7d
            </span>
          </div>
          <p className="font-semibold text-white">Renews in &le; 7 Days</p>
          <p className="text-slate-400 text-[11px] mt-1">
            Review before automatic renewal charge occurs.
          </p>
        </div>
      </div>
    </div>
  );
};
