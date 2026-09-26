import React from 'react';
import { CreditCard, Sparkles, ShieldAlert, Terminal, Plus, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'scorecard' | 'ask-ai' | 'gcp-guide';
  setActiveTab: (tab: 'dashboard' | 'scorecard' | 'ask-ai' | 'gcp-guide') => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
  reviewCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onResetData,
  reviewCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">SubSense</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Waste Detector
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Know what you're paying for. Know what you're actually using.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 relative ${
                activeTab === 'scorecard'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Scorecard</span>
              {reviewCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                  {reviewCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ask-ai')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'ask-ai'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Ask SubSense</span>
            </button>
            <button
              onClick={() => setActiveTab('gcp-guide')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'gcp-guide'
                  ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-800'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">30-Min GCP Guide</span>
              <span className="md:hidden">GCP</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetData}
              title="Reset to demo sample subscriptions"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1 border border-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">Reset Demo</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Subscription</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
