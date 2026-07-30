"use client";

import { AlertCircle, TrendingUp, Activity, BarChart2, CheckCircle2, ShieldAlert } from "lucide-react";

export function getCategoryIcon(category: string) {
  const lower = (category || '').toLowerCase();
  if (lower.includes('trend')) return <TrendingUp className="h-5 w-5 text-emerald-400" />;
  if (lower.includes('anomaly')) return <AlertCircle className="h-5 w-5 text-rose-400" />;
  if (lower.includes('quality')) return <ShieldAlert className="h-5 w-5 text-amber-400" />;
  if (lower.includes('performance')) return <Activity className="h-5 w-5 text-indigo-400" />;
  return <BarChart2 className="h-5 w-5 text-blue-400" />;
}

export function getSeverityColor(severity: string) {
  const lower = (severity || '').toLowerCase();
  if (lower.includes('critical')) return 'border-rose-500/40 bg-rose-500/10 text-rose-200';
  if (lower.includes('warning')) return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
  return 'border-indigo-500/30 bg-slate-900/60 text-slate-100';
}

export default function InsightCard({ insight }: { insight: any }) {
  return (
    <div className={`p-5 rounded-2xl border ${getSeverityColor(insight.severity)} backdrop-blur-md flex flex-col h-full shadow-lg transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/10 shrink-0">
            {getCategoryIcon(insight.category)}
          </div>
          <h4 className="font-bold text-base leading-snug">{insight.title}</h4>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950/80 font-medium capitalize border border-slate-700/80 shrink-0">
          {insight.category}
        </span>
      </div>
      
      <p className="text-xs sm:text-sm opacity-90 mb-4 flex-1 leading-relaxed">
        {insight.description}
      </p>

      <div className="space-y-2 mt-auto pt-3.5 border-t border-white/10 text-xs">
        <div className="flex items-start gap-2">
          <span className="font-semibold opacity-75 min-w-[70px] uppercase text-[10px] tracking-wider pt-0.5">Evidence:</span>
          <span className="opacity-90">{insight.supporting_evidence}</span>
        </div>
        
        {insight.suggested_next_action && (
          <div className="flex items-start gap-2">
            <span className="font-semibold opacity-75 min-w-[70px] uppercase text-[10px] tracking-wider pt-0.5">Action:</span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {insight.suggested_next_action}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

