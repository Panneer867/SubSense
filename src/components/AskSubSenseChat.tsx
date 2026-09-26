import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, RefreshCw, MessageSquare, Flame } from 'lucide-react';
import { Subscription, ChatMessage } from '../types/subscription';

interface AskSubSenseChatProps {
  subscriptions: Subscription[];
  totalMonthly: number;
  totalYearly: number;
}

export const AskSubSenseChat: React.FC<AskSubSenseChatProps> = ({
  subscriptions,
  totalMonthly,
  totalYearly,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'gemini',
      text: `Hello! I'm SubSense Assistant. I have indexed your ${subscriptions.length} recurring subscriptions (totaling ₹${totalMonthly.toLocaleString()}/mo, ₹${totalYearly.toLocaleString()}/yr). You can ask me anything about your spending, inactivity, category overlaps, or upcoming renewals.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQueries = [
    'How much am I spending on entertainment?',
    "Which subscriptions haven't I used recently?",
    'What subscriptions are renewing this month?',
    'Show me subscriptions that might overlap.',
    'What are my 3 most expensive subscriptions?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || inputText;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/query-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          subscriptions: subscriptions.map((s) => ({
            name: s.name,
            amount: s.amount,
            currency: s.currency,
            billingCycle: s.billingCycle,
            annualCost: s.annualCost,
            monthlyEquivalent: s.monthlyEquivalent,
            category: s.category,
            daysSinceLastUsed: s.daysSinceLastUsed,
            usageFrequency: s.usageFrequency,
            renewalDay: s.renewalDay,
            daysUntilRenewal: s.daysUntilRenewal,
            status: s.status,
            overlapsWith: s.overlapsWith,
            notes: s.notes,
          })),
          totalMonthly,
          totalYearly,
        }),
      });

      if (!response.ok) throw new Error('Query failed');
      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `g-${Date.now()}`,
        sender: 'gemini',
        text: data.answer || 'I could not process that question right now.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      // Client-side intelligent fallback response
      const answer = generateLocalAnswer(q, subscriptions, totalMonthly, totalYearly);
      const aiMsg: ChatMessage = {
        id: `g-${Date.now()}`,
        sender: 'gemini',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const generateLocalAnswer = (
    q: string,
    subs: Subscription[],
    month: number,
    year: number
  ): string => {
    const lower = q.toLowerCase();
    if (lower.includes('entertainment')) {
      const ent = subs.filter((s) => s.category.toLowerCase().includes('entertainment') || s.name.match(/netflix|youtube|prime|disney|hotstar/i));
      const total = ent.reduce((sum, s) => sum + (s.monthlyEquivalent || 0), 0);
      const names = ent.map((s) => `${s.name} (₹${s.amount}/${s.billingCycle.toLowerCase()})`).join(', ');
      return `You are currently spending ₹${total.toLocaleString()}/month on entertainment across ${ent.length} subscriptions (${names}), which amounts to ₹${(total * 12).toLocaleString()} per year.`;
    }

    if (lower.includes('recent') || lower.includes('inactiv') || lower.includes("haven't")) {
      const inactive = subs.filter((s) => (s.daysSinceLastUsed || 0) > 20);
      if (inactive.length === 0) return 'All your subscriptions have recorded usage within the past 20 days!';
      const list = inactive.map((s) => `• ${s.name}: last used ${s.daysSinceLastUsed} days ago (costs ₹${s.monthlyEquivalent}/mo)`).join('\n');
      return `Here are the subscriptions you haven't used recently:\n${list}\n\nReviewing these could save you up to ₹${inactive.reduce((sum, s) => sum + (s.annualCost || 0), 0).toLocaleString()} annually.`;
    }

    if (lower.includes('renew') || lower.includes('month') || lower.includes('soon')) {
      const renewing = subs.filter((s) => (s.daysUntilRenewal || 0) <= 14);
      const list = renewing.map((s) => `• ${s.name}: renews in ${s.daysUntilRenewal} days (₹${s.amount})`).join('\n');
      return `Subscriptions renewing in the next two weeks:\n${list}`;
    }

    if (lower.includes('overlap')) {
      const overlapping = subs.filter((s) => s.overlapsWith && s.overlapsWith.length > 0);
      const list = overlapping.map((s) => `• ${s.name} overlaps with ${s.overlapsWith?.join(', ')} in ${s.category}`).join('\n');
      return `Potential category overlaps detected:\n${list || 'No duplicate category subscriptions found.'}`;
    }

    return `You have ${subs.length} active subscriptions costing ₹${month.toLocaleString()}/month (₹${year.toLocaleString()}/year). Ask me about specific categories, inactivity, renewals, or waste candidates!`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              Ask SubSense Intelligence
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Gemini 2.5 Grounded
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Query your Cloud SQL database records with plain English
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-400 hidden sm:block">
          <span className="text-indigo-400 font-semibold">{subscriptions.length} subscriptions</span> loaded
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="bg-slate-950/40 border-b border-slate-800/80 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-purple-400" /> Prompts:
        </span>
        {suggestedQueries.map((query, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(query)}
            disabled={loading}
            className="text-[11px] text-slate-300 hover:text-purple-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-full px-3 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'gemini' && (
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none whitespace-pre-line'
              }`}
            >
              <p>{msg.text}</p>
              <span
                className={`text-[10px] mt-1.5 block text-right ${
                  msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Analyzing subscriptions with Gemini...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything (e.g. &quot;How much am I spending on cloud servers?&quot;)"
            disabled={loading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
