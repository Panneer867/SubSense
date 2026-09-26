import React from 'react';
import { DollarSign, AlertTriangle, ShieldCheck, Calendar, ArrowUpRight, Flame } from 'lucide-react';

interface SpendSummaryCardsProps {
  totalMonthly: number;
  totalYearly: number;
  potentialWaste: number;
  avgHealthScore: number;
  activeCount: number;
  needsReviewCount: number;
  renewingSoonCount: number;
  overlapCount: number;
  onFilterReview: () => void;
}

export const SpendSummaryCards: React.FC<SpendSummaryCardsProps> = ({
  totalMonthly,
  totalYearly,
  potentialWaste,
  avgHealthScore,
  activeCount,
  needsReviewCount,
  renewingSoonCount,
  overlapCount,
  onFilterReview,
}) => {
  const formatINR = (val: number) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { label: 'Optimal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 60) return { label: 'Moderate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Waste Alert', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const healthBadge = getHealthBadge(avgHealthScore);

  return (
    <div className="space-y-4">
      {/* 4 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Cost */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Monthly Cost</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatINR(totalMonthly)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Across {activeCount} active services</span>
            <span className="text-indigo-400 font-medium">{formatINR(Math.round(totalMonthly / (activeCount || 1)))} avg/sub</span>
          </div>
        </div>

        {/* Yearly Cost */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Yearly Projection</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatINR(totalYearly)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ year</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Annual recurring drain</span>
            <span className="text-purple-400 font-medium">100% recurring</span>
          </div>
        </div>

        {/* Potential Waste Identified */}
        <div
          onClick={onFilterReview}
          className="bg-slate-900/80 border border-rose-900/40 hover:border-rose-700/60 rounded-xl p-5 shadow-sm relative overflow-hidden group transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="text-rose-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Potential Waste
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400 tracking-tight">
            {formatINR(potentialWaste)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ yr</span>
          </div>
          <div className="mt-3 text-xs flex items-center justify-between">
            <span className="text-rose-300 font-medium">{needsReviewCount} flagged for review</span>
            <span className="text-xs text-rose-400 flex items-center group-hover:translate-x-0.5 transition-transform">
              Review now <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Portfolio Health Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Portfolio Health</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {avgHealthScore}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${healthBadge.color}`}>
              {healthBadge.label}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                avgHealthScore >= 80 ? 'bg-emerald-500' : avgHealthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${avgHealthScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="font-semibold">{activeCount}</span> Total Subscriptions
          </div>
          <div className="flex items-center gap-1.5 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-semibold">{needsReviewCount}</span> Needs Review
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-semibold">{renewingSoonCount}</span> Renewing in 7 Days
          </div>
          {overlapCount > 0 && (
            <div className="flex items-center gap-1.5 text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="font-semibold">{overlapCount}</span> Overlapping Categories
            </div>
          )}
        </div>
        <div className="text-slate-400 text-[11px]">
          Deterministic rules: Inactivity &gt;30d • Cost &gt;₹500+rare • Overlaps
        </div>
      </div>
    </div>
  );
};
