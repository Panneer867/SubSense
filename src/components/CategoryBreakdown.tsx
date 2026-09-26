import React from 'react';
import { Subscription } from '../types/subscription';
import { PieChart, Film, Music, Briefcase, Cloud, Dumbbell, BookOpen, Layers } from 'lucide-react';

interface CategoryBreakdownProps {
  subscriptions: Subscription[];
  totalYearly: number;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ subscriptions, totalYearly }) => {
  // Aggregate by category
  const categoryMap: { [cat: string]: { count: number; monthly: number; yearly: number } } = {};

  subscriptions.forEach((sub) => {
    const cat = sub.category || 'Other';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, monthly: 0, yearly: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].monthly += sub.monthlyEquivalent || 0;
    categoryMap[cat].yearly += sub.annualCost || 0;
  });

  const categories = Object.entries(categoryMap).sort((a, b) => b[1].yearly - a[1].yearly);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'entertainment':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'music':
        return <Music className="w-4 h-4 text-teal-400" />;
      case 'productivity':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'cloud & devops':
        return <Cloud className="w-4 h-4 text-indigo-400" />;
      case 'fitness':
        return <Dumbbell className="w-4 h-4 text-rose-400" />;
      case 'learning':
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBarColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'entertainment':
        return 'bg-purple-500';
      case 'music':
        return 'bg-teal-500';
      case 'productivity':
        return 'bg-blue-500';
      case 'cloud & devops':
        return 'bg-indigo-500';
      case 'fitness':
        return 'bg-rose-500';
      case 'learning':
        return 'bg-amber-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-400" />
          Spending by Category
        </h3>
        <span className="text-xs text-slate-400">{categories.length} categories</span>
      </div>

      <div className="space-y-3">
        {categories.map(([cat, data]) => {
          const percent = totalYearly > 0 ? Math.round((data.yearly / totalYearly) * 100) : 0;
          return (
            <div key={cat} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  {getCategoryIcon(cat)}
                  {cat}
                  <span className="text-slate-500 text-[10px]">({data.count})</span>
                </span>
                <span className="text-white font-semibold">
                  ₹{Math.round(data.yearly).toLocaleString('en-IN')}/yr
                  <span className="text-slate-400 font-normal ml-1">({percent}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(cat)}`}
                  style={{ width: `${Math.max(5, percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
