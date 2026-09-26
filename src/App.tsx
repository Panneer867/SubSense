/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { SpendSummaryCards } from './components/SpendSummaryCards';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { SubscriptionCard } from './components/SubscriptionCard';
import { WasteAnalysisPanel } from './components/WasteAnalysisPanel';
import { AskSubSenseChat } from './components/AskSubSenseChat';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { SubscriptionModal } from './components/SubscriptionModal';
import { GcpDeploymentGuide } from './components/GcpDeploymentGuide';
import { INITIAL_SUBSCRIPTIONS } from './utils/sampleData';
import { computePortfolioStats } from './utils/rulesEngine';
import { Subscription, UsageFrequency, UserActionDecision } from './types/subscription';
import { Filter, Search, ArrowUpDown, ShieldAlert, Sparkles, Check, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scorecard' | 'ask-ai' | 'gcp-guide'>('dashboard');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('subsense_subscriptions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SUBSCRIPTIONS;
      }
    }
    return INITIAL_SUBSCRIPTIONS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'cost-desc' | 'cost-asc' | 'last-used' | 'health-score' | 'name'>('cost-desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('subsense_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Run deterministic rules engine across all subscriptions
  const stats = useMemo(() => {
    return computePortfolioStats(subscriptions);
  }, [subscriptions]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, [subscriptions]);

  // Filter & sort
  const filteredSubscriptions = useMemo(() => {
    return stats.evaluated
      .filter((s) => {
        // Status filter
        if (filterStatus === 'REVIEW') {
          if (s.status !== 'REVIEW' && s.status !== 'HIGH_REVIEW') return false;
        } else if (filterStatus === 'HIGH_REVIEW') {
          if (s.status !== 'HIGH_REVIEW') return false;
        } else if (filterStatus === 'OVERLAP') {
          if (!s.overlapsWith || s.overlapsWith.length === 0) return false;
        } else if (filterStatus === 'RENEWING_SOON') {
          if ((s.daysUntilRenewal || 0) > 7) return false;
        } else if (filterStatus === 'ACTIVE') {
          if (s.status !== 'ACTIVE') return false;
        }

        // Category filter
        if (filterCategory !== 'ALL' && s.category !== filterCategory) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchCat = s.category.toLowerCase().includes(q);
          const matchNotes = (s.notes || '').toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'cost-desc') return (b.annualCost || 0) - (a.annualCost || 0);
        if (sortBy === 'cost-asc') return (a.annualCost || 0) - (b.annualCost || 0);
        if (sortBy === 'last-used') return (b.daysSinceLastUsed || 0) - (a.daysSinceLastUsed || 0);
        if (sortBy === 'health-score') return (a.healthScore || 0) - (b.healthScore || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [stats.evaluated, filterStatus, filterCategory, searchQuery, sortBy]);

  // Handlers
  const handleAddSubscription = (newSub: Omit<Subscription, 'id' | 'createdAt'>) => {
    const sub: Subscription = {
      ...newSub,
      id: `sub-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSubscriptions((prev) => [sub, ...prev]);
    showToast(`Added "${sub.name}" to SubSense!`);
  };

  const handleSaveModal = (data: Omit<Subscription, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === existingId
            ? { ...item, ...data }
            : item
        )
      );
      showToast(`Updated "${data.name}"`);
    } else {
      handleAddSubscription(data);
    }
    setEditingSub(null);
  };

  const handleDelete = (id: string) => {
    const item = subscriptions.find((s) => s.id === id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    showToast(`Deleted ${item?.name || 'subscription'}`);
  };

  const handleUpdateUsage = (id: string, frequency: UsageFrequency) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, usageFrequency: frequency } : s))
    );
    showToast(`Updated usage frequency`);
  };

  const handleLogUsageToday = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lastUsedDate: today } : s))
    );
    showToast(`Logged usage for today! Score updated.`);
  };

  const handleUpdateDecision = (id: string, decision: UserActionDecision) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, decision } : s))
    );
    showToast(`Decision saved: ${decision}`);
  };

  const handleResetData = () => {
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    showToast('Reset to demo subscriptions.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingSub(null);
          setIsModalOpen(true);
        }}
        onResetData={handleResetData}
        reviewCount={stats.needsReviewCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <SpendSummaryCards
              totalMonthly={stats.totalMonthly}
              totalYearly={stats.totalYearly}
              potentialWaste={stats.potentialWaste}
              avgHealthScore={stats.avgHealthScore}
              activeCount={stats.activeCount}
              needsReviewCount={stats.needsReviewCount}
              renewingSoonCount={stats.renewingSoonCount}
              overlapCount={stats.overlapCount}
              onFilterReview={() => setFilterStatus('REVIEW')}
            />

            {/* Natural-Language Input with Gemini */}
            <NaturalLanguageInput onAddSubscription={handleAddSubscription} />

            {/* Waste & Overlap Intelligence Panel */}
            <WasteAnalysisPanel
              subscriptions={stats.evaluated}
              totalMonthly={stats.totalMonthly}
              totalYearly={stats.totalYearly}
              potentialWaste={stats.potentialWaste}
              needsReviewCount={stats.needsReviewCount}
              onFilterStatus={(status) => setFilterStatus(status)}
            />

            {/* Filter, Search & Sort Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  Status:
                </span>
                {[
                  { id: 'ALL', label: 'All', count: stats.activeCount },
                  { id: 'REVIEW', label: 'Needs Review', count: stats.needsReviewCount },
                  { id: 'HIGH_REVIEW', label: 'High Cost Waste', count: stats.evaluated.filter(s => s.status === 'HIGH_REVIEW').length },
                  { id: 'OVERLAP', label: 'Overlaps', count: stats.overlapCount },
                  { id: 'RENEWING_SOON', label: 'Renews in 7d', count: stats.renewingSoonCount },
                  { id: 'ACTIVE', label: 'Active / Healthy', count: stats.evaluated.filter(s => s.status === 'ACTIVE').length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      filterStatus === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/50 font-bold">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search, Category, and Sort */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, notes..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
                  />
                </div>

                {/* Category select */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Sort select */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="cost-desc">Cost: High to Low</option>
                  <option value="cost-asc">Cost: Low to High</option>
                  <option value="last-used">Last Used: Oldest</option>
                  <option value="health-score">Health Score: Lowest</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Subscriptions Grid & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left 2 Cols: Subscription Health Scorecards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Showing <b>{filteredSubscriptions.length}</b> of {subscriptions.length} subscriptions
                  </span>
                  {filterStatus !== 'ALL' && (
                    <button
                      onClick={() => {
                        setFilterStatus('ALL');
                        setFilterCategory('ALL');
                        setSearchQuery('');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {filteredSubscriptions.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-300">No subscriptions match your filter</p>
                    <p className="text-xs mt-1">Try switching status filters or clear search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredSubscriptions.map((sub) => (
                      <SubscriptionCard
                        key={sub.id}
                        subscription={sub}
                        onUpdateUsage={handleUpdateUsage}
                        onLogUsageToday={handleLogUsageToday}
                        onUpdateDecision={handleUpdateDecision}
                        onEdit={(item) => {
                          setEditingSub(item);
                          setIsModalOpen(true);
                        }}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: Category Breakdown & Quick Assistant */}
              <div className="space-y-6">
                <CategoryBreakdown subscriptions={stats.evaluated} totalYearly={stats.totalYearly} />

                {/* Quick Chat Snippet card */}
                <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Ask SubSense Assistant</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Have questions about your entertainment spending, renewals, or potential overlap? Gemini is ready to answer based on your real data.
                  </p>
                  <button
                    onClick={() => setActiveTab('ask-ai')}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25"
                  >
                    <span>Launch SubSense AI Chat</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Scorecard */}
        {activeTab === 'scorecard' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">Subscription Health Scorecard</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluate usage frequency, inactivity periods, and cost-efficiency for every recurring subscription.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Flagged Items</div>
                  <div className="text-lg font-bold text-rose-400">{stats.needsReviewCount} Subscriptions</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.evaluated.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  onUpdateUsage={handleUpdateUsage}
                  onLogUsageToday={handleLogUsageToday}
                  onUpdateDecision={handleUpdateDecision}
                  onEdit={(item) => {
                    setEditingSub(item);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Ask SubSense Chat */}
        {activeTab === 'ask-ai' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <AskSubSenseChat
              subscriptions={stats.evaluated}
              totalMonthly={stats.totalMonthly}
              totalYearly={stats.totalYearly}
            />
          </div>
        )}

        {/* Tab 4: 30-Min GCP Guide */}
        {activeTab === 'gcp-guide' && <GcpDeploymentGuide />}
      </main>

      {/* Manual Add / Edit Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSub(null);
        }}
        onSave={handleSaveModal}
        initialData={editingSub}
      />
    </div>
  );
}
