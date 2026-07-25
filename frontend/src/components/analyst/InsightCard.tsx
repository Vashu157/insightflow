"use client";

import { AlertCircle, TrendingUp, Activity, BarChart2, CheckCircle2, ShieldAlert } from "lucide-react";

export function getCategoryIcon(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes('trend')) return <TrendingUp className="h-5 w-5 text-emerald-400" />;
  if (lower.includes('anomaly')) return <AlertCircle className="h-5 w-5 text-rose-400" />;
  if (lower.includes('quality')) return <ShieldAlert className="h-5 w-5 text-amber-400" />;
  if (lower.includes('performance')) return <Activity className="h-5 w-5 text-indigo-400" />;
  return <BarChart2 className="h-5 w-5 text-blue-400" />;
}

export function getSeverityColor(severity: string) {
  const lower = severity.toLowerCase();
  if (lower.includes('critical')) return 'border-rose-500/50 bg-rose-500/10 text-rose-200';
  if (lower.includes('warning')) return 'border-amber-500/50 bg-amber-500/10 text-amber-200';
  return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200';
}

export default function InsightCard({ insight }: { insight: any }) {
  return (
    <div className={`p-4 rounded-xl border ${getSeverityColor(insight.severity)} backdrop-blur-sm flex flex-col h-full`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getCategoryIcon(insight.category)}
          <h4 className="font-semibold text-lg">{insight.title}</h4>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-slate-900/50 font-medium capitalize border border-slate-700">
          {insight.category}
        </span>
      </div>
      
      <p className="text-sm opacity-90 mb-4 flex-1">
        {insight.description}
      </p>

      <div className="space-y-2 mt-auto pt-4 border-t border-white/10">
        <div className="flex items-start gap-2 text-xs">
          <span className="font-semibold opacity-75 min-w-[70px]">Evidence:</span>
          <span className="opacity-90">{insight.supporting_evidence}</span>
        </div>
        
        {insight.suggested_next_action && (
          <div className="flex items-start gap-2 text-xs">
            <span className="font-semibold opacity-75 min-w-[70px]">Action:</span>
            <span className="flex items-center gap-1 text-emerald-300 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              {insight.suggested_next_action}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
