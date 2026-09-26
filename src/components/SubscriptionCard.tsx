import React from 'react';
import { Subscription, UsageFrequency, UserActionDecision } from '../types/subscription';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Copy,
  Zap,
  Edit2,
  Trash2,
  TrendingDown,
  Activity,
  Layers,
} from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdateUsage: (id: string, frequency: UsageFrequency) => void;
  onLogUsageToday: (id: string) => void;
  onUpdateDecision: (id: string, decision: UserActionDecision) => void;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onUpdateUsage,
  onLogUsageToday,
  onUpdateDecision,
  onEdit,
  onDelete,
}) => {
  const {
    id,
    name,
    amount,
    currency,
    billingCycle,
    category,
    annualCost = 0,
    monthlyEquivalent = 0,
    daysSinceLastUsed = 0,
    daysUntilRenewal = 0,
    usageFrequency,
    status = 'ACTIVE',
    statusReasons = [],
    overlapsWith = [],
    healthScore = 100,
    decision = 'PENDING',
    notes,
  } = subscription;

  const formatCurrency = (val: number) => {
    return (currency === 'INR' ? '₹' : currency + ' ') + val.toLocaleString('en-IN');
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'HIGH_REVIEW':
        return {
          label: 'High Review',
          color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: <AlertTriangle className="w-3 h-3 text-rose-400" />,
        };
      case 'REVIEW':
        return {
          label: 'Review',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
        };
      case 'OVERLAP':
        return {
          label: 'Category Overlap',
          color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          icon: <Layers className="w-3 h-3 text-purple-400" />,
        };
      case 'ACTIVE':
      default:
        return {
          label: 'Active',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle className="w-3 h-3 text-emerald-400" />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  const getUsageColor = (freq: UsageFrequency) => {
    switch (freq) {
      case 'daily':
        return 'text-emerald-400';
      case 'weekly':
        return 'text-teal-400';
      case 'moderate':
        return 'text-sky-400';
      case 'rare':
        return 'text-amber-400';
      case 'never':
        return 'text-rose-400';
    }
  };

  const getLastUsedLabel = (days: number) => {
    if (days === 0) return 'Used Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div
      className={`bg-slate-900 border rounded-xl p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
        status === 'HIGH_REVIEW'
          ? 'border-rose-800/60 shadow-lg shadow-rose-950/20'
          : status === 'REVIEW'
          ? 'border-amber-800/50 shadow-md shadow-amber-950/10'
          : status === 'OVERLAP'
          ? 'border-purple-800/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Banner if High Review or Imminent Renewal */}
      {daysUntilRenewal <= 7 && (
        <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-600/30 via-rose-600/30 to-amber-600/30 text-amber-200 text-[10px] font-semibold py-0.5 px-3 flex items-center justify-between border-b border-amber-500/20">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Renews in {daysUntilRenewal === 0 ? 'Today' : `${daysUntilRenewal} days`}
          </span>
          {status !== 'ACTIVE' && <span className="font-bold text-rose-300">Action Recommended</span>}
        </div>
      )}

      {/* Main Header */}
      <div className={`flex items-start justify-between gap-3 ${daysUntilRenewal <= 7 ? 'mt-3' : ''}`}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-base tracking-tight">{name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
              {category}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-extrabold text-white tracking-tight">
              {formatCurrency(amount)}
            </span>
            <span className="text-xs text-slate-400">/{billingCycle.toLowerCase()}</span>
            {billingCycle !== 'YEARLY' && (
              <span className="text-[11px] text-slate-500 ml-1">
                ({formatCurrency(annualCost)}/yr)
              </span>
            )}
          </div>
        </div>

        {/* Status Badge & Health Score */}
        <div className="flex flex-col items-end gap-1.5">
          <div
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${statusBadge.color}`}
          >
            {statusBadge.icon}
            <span>{statusBadge.label}</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>Score:</span>
            <span
              className={`font-bold ${
                healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {healthScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Health Scorecard Breakdown */}
      <div className="my-4 grid grid-cols-2 gap-2 bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-xs">
        <div>
          <span className="text-[10px] uppercase text-slate-400 block font-medium">Usage Level</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Activity className={`w-3.5 h-3.5 ${getUsageColor(usageFrequency)}`} />
            <select
              value={usageFrequency}
              onChange={(e) => onUpdateUsage(id, e.target.value as UsageFrequency)}
              className="bg-slate-800 text-xs rounded border border-slate-700 px-1 py-0.5 text-slate-200 capitalize focus:outline-none cursor-pointer"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="moderate">Moderate</option>
              <option value="rare">Rare</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400 block font-medium">Last Used</span>
          <div className="flex items-center justify-between mt-0.5">
            <span
              className={`font-semibold ${
                daysSinceLastUsed > 30 ? 'text-rose-400' : daysSinceLastUsed > 14 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {getLastUsedLabel(daysSinceLastUsed)}
            </span>
            <button
              onClick={() => onLogUsageToday(id)}
              title="Click if you used this today"
              className="text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            >
              Log Today
            </button>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400 block font-medium">Annual Cost</span>
          <span className="font-bold text-slate-200">{formatCurrency(annualCost)}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400 block font-medium">Monthly Equiv</span>
          <span className="font-semibold text-slate-300">{formatCurrency(monthlyEquivalent)}/mo</span>
        </div>
      </div>

      {/* Warning/Overlap Alerts from Deterministic Rules */}
      {statusReasons.length > 0 && (
        <div className="mb-3 space-y-1">
          {statusReasons.map((reason, idx) => (
            <div
              key={idx}
              className={`text-[11px] px-2.5 py-1 rounded flex items-center gap-1.5 ${
                status === 'HIGH_REVIEW'
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  : status === 'REVIEW'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notes if available */}
      {notes && <p className="text-[11px] text-slate-400 italic mb-3 line-clamp-1">{notes}</p>}

      {/* User Decision Action Bar */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 mr-1">Decision:</span>
          <button
            onClick={() => onUpdateDecision(id, 'KEEP')}
            className={`text-[11px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
              decision === 'KEEP'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Keep
          </button>
          <button
            onClick={() => onUpdateDecision(id, 'DOWNGRADE')}
            className={`text-[11px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
              decision === 'DOWNGRADE'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Downgrade
          </button>
          <button
            onClick={() => onUpdateDecision(id, 'CANCEL')}
            className={`text-[11px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
              decision === 'CANCEL'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Cancel
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(subscription)}
            title="Edit subscription"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(id)}
            title="Delete subscription"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
