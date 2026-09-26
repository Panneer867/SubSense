import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Wand2, Database } from 'lucide-react';
import { Subscription } from '../types/subscription';

interface NaturalLanguageInputProps {
  onAddSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => void;
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({ onAddSubscription }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [source, setSource] = useState<string>('');

  const samplePrompts = [
    'I pay 649 for Netflix every month and my renewal is on the 12th',
    'I subscribed to Canva for 5,000 last December for one year',
    'AWS cloud server approx 800 per month renews on 1st',
    'Cult.fit gym membership 1,500 monthly on 28th',
    'Spotify family plan 179 every month',
    'ChatGPT Plus 1,999 monthly for productivity',
  ];

  const handleExtract = async (textToExtract?: string) => {
    const text = textToExtract || inputText;
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const response = await fetch('/api/extract-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, defaultCurrency: 'INR' }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract subscription info');
      }

      const data = await response.json();
      setExtractedData(data.subscription);
      setSource(data.source || 'gemini');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with extraction service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!extractedData) return;

    onAddSubscription({
      name: extractedData.name,
      amount: Number(extractedData.amount) || 0,
      currency: extractedData.currency || 'INR',
      billingCycle: extractedData.billingCycle || 'MONTHLY',
      category: extractedData.category || 'Other',
      renewalDay: extractedData.renewalDay || 1,
      lastUsedDate: new Date().toISOString().split('T')[0],
      usageFrequency: extractedData.usageFrequency || 'moderate',
      notes: extractedData.notes || 'Extracted via Gemini NLP',
      decision: 'PENDING',
    });

    // Reset
    setExtractedData(null);
    setInputText('');
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Gemini Natural-Language Subscription Entry
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Zero Form Fatigue
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Type or paste naturally. Gemini extracts structured metadata, validated by backend before saving.
            </p>
          </div>
        </div>
      </div>

      {/* Input row */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
            placeholder="e.g. &quot;I pay 649 for Netflix every month and renewal is on the 12th&quot;"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-10"
          />
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={() => handleExtract()}
          disabled={isLoading || !inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Extracting...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>Extract with Gemini</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Prompts Chips */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium">Try clicking:</span>
        {samplePrompts.slice(0, 4).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputText(prompt);
              handleExtract(prompt);
            }}
            className="text-[11px] text-slate-300 hover:text-indigo-300 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-2.5 py-1 transition-colors cursor-pointer text-left truncate max-w-[280px]"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Extracted Card Confirmation */}
      {extractedData && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800/90 border border-indigo-500/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3 border-b border-slate-700/70 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Extracted by {source === 'gemini' ? 'Gemini 2.5 Flash' : 'SubSense NLP Engine'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Verify &amp; confirm before saving</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">Service</span>
              <input
                type="text"
                value={extractedData.name}
                onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                className="font-bold text-white text-sm bg-transparent border-none p-0 focus:outline-none w-full"
              />
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">Amount</span>
              <div className="flex items-center gap-1 font-bold text-emerald-400 text-sm">
                <span>{extractedData.currency === 'INR' ? '₹' : extractedData.currency}</span>
                <input
                  type="number"
                  value={extractedData.amount}
                  onChange={(e) => setExtractedData({ ...extractedData, amount: Number(e.target.value) })}
                  className="bg-transparent border-none p-0 focus:outline-none text-emerald-400 font-bold w-full"
                />
              </div>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">Cycle</span>
              <select
                value={extractedData.billingCycle}
                onChange={(e) => setExtractedData({ ...extractedData, billingCycle: e.target.value })}
                className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-1 py-0.5 mt-0.5 w-full focus:outline-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">Category</span>
              <select
                value={extractedData.category}
                onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-1 py-0.5 mt-0.5 w-full focus:outline-none"
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

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">Renewal Day</span>
              <input
                type="number"
                min="1"
                max="31"
                value={extractedData.renewalDay || 1}
                onChange={(e) => setExtractedData({ ...extractedData, renewalDay: Number(e.target.value) })}
                className="font-bold text-white text-sm bg-transparent border-none p-0 focus:outline-none w-full"
              />
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block uppercase">Usage Level</span>
              <select
                value={extractedData.usageFrequency || 'moderate'}
                onChange={(e) => setExtractedData({ ...extractedData, usageFrequency: e.target.value })}
                className="bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 px-1 py-0.5 mt-0.5 w-full focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="moderate">Moderate</option>
                <option value="rare">Rare</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setExtractedData(null)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleConfirmAdd}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Save Subscription to SubSense</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
