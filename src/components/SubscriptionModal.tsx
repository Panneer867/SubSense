import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { Subscription, BillingCycle, UsageFrequency } from '../types/subscription';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sub: Omit<Subscription, 'id' | 'createdAt'>, existingId?: string) => void;
  initialData?: Subscription | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [category, setCategory] = useState('Entertainment');
  const [renewalDay, setRenewalDay] = useState<number>(1);
  const [lastUsedDate, setLastUsedDate] = useState(new Date().toISOString().split('T')[0]);
  const [usageFrequency, setUsageFrequency] = useState<UsageFrequency>('moderate');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount);
      setCurrency(initialData.currency);
      setBillingCycle(initialData.billingCycle);
      setCategory(initialData.category);
      setRenewalDay(initialData.renewalDay || 1);
      setLastUsedDate(initialData.lastUsedDate || new Date().toISOString().split('T')[0]);
      setUsageFrequency(initialData.usageFrequency);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setAmount('');
      setCurrency('INR');
      setBillingCycle('MONTHLY');
      setCategory('Entertainment');
      setRenewalDay(1);
      setLastUsedDate(new Date().toISOString().split('T')[0]);
      setUsageFrequency('moderate');
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount === '' || amount <= 0) return;

    onSave(
      {
        name,
        amount: Number(amount),
        currency,
        billingCycle,
        category,
        renewalDay: Number(renewalDay),
        lastUsedDate,
        usageFrequency,
        notes,
        decision: initialData?.decision || 'PENDING',
      },
      initialData?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            {initialData ? 'Edit Subscription' : 'Add New Subscription'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Service Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, Spotify, AWS, Notion"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
                  {currency === 'INR' ? '₹' : currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="649"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Entertainment">Entertainment</option>
                <option value="Music">Music</option>
                <option value="Productivity">Productivity</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Fitness">Fitness</option>
                <option value="Learning">Learning</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Renewal Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={renewalDay}
                onChange={(e) => setRenewalDay(Number(e.target.value))}
                placeholder="12"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Usage Frequency
              </label>
              <select
                value={usageFrequency}
                onChange={(e) => setUsageFrequency(e.target.value as UsageFrequency)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="moderate">Moderate</option>
                <option value="rare">Rare</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Last Used Date
              </label>
              <input
                type="date"
                value={lastUsedDate}
                onChange={(e) => setLastUsedDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Notes &amp; Context
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Shared with roommate, thinking of canceling after season 2..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Update Subscription' : 'Save Subscription'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
