"use client";

import { useInsights, useRefreshInsights } from "@/hooks/useInsights";
import { Loader2, RefreshCw, FileText, Target, AlertTriangle, Lightbulb } from "lucide-react";
import InsightCard from "./InsightCard";
import { Button } from "@/components/ui/button";

export default function AnalystView({ sessionId }: { sessionId: string }) {
  const { data, isLoading, error } = useInsights(sessionId);
  const { mutate: refresh, isPending: isRefreshing } = useRefreshInsights(sessionId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-slate-400 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-lg">The AI is analyzing your dataset profile...</p>
        <p className="text-sm opacity-70">This typically takes 10-20 seconds.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[400px] text-rose-400">
        <p>Failed to generate the business report. Ensure your API key is correct.</p>
      </div>
    );
  }

  const { report, generated_at, is_cached } = data;
  const { executive_summary, insights, anomalies, recommendations, suggested_questions } = report;

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Meta */}
      <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-indigo-400" />
          <span className="text-sm text-slate-300">
            Report generated at {new Date(generated_at).toLocaleString()}
            {is_cached && <span className="ml-2 text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">Cached</span>}
          </span>
        </div>
        <Button 
          onClick={() => refresh()} 
          disabled={isRefreshing}
          variant="outline"
          className="bg-slate-800 border-slate-700 hover:bg-slate-700"
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Regenerate Report
        </Button>
      </div>

      {/* Executive Summary */}
      <section className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 p-6 rounded-2xl border border-indigo-500/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="text-indigo-400" /> Executive Summary
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Overview</h3>
              <p className="text-slate-200 leading-relaxed">{executive_summary.dataset_overview}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall Health</h3>
              <p className="text-slate-200 leading-relaxed">{executive_summary.overall_health}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Observations</h3>
              <ul className="list-disc list-inside text-slate-200 space-y-1">
                {executive_summary.key_observations.map((obs: string, i: number) => <li key={i}>{obs}</li>)}
              </ul>
            </div>
            {executive_summary.data_quality_issues.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-rose-400/80 uppercase tracking-wider mb-2">Quality Issues</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {executive_summary.data_quality_issues.map((iss: string, i: number) => <li key={i}>{iss}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Key Insights Grid */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="text-amber-400" /> Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {insights.map((insight: any, i: number) => (
            <InsightCard key={`insight-${i}`} insight={insight} />
          ))}
        </div>
      </section>

      {/* Anomalies */}
      {anomalies && anomalies.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-rose-400" /> Anomalies & Risks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {anomalies.map((anomaly: any, i: number) => (
              <InsightCard key={`anomaly-${i}`} insight={anomaly} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Strategic Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec: any, i: number) => (
            <div key={`rec-${i}`} className="bg-slate-900/50 p-5 rounded-xl border border-emerald-500/20">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-emerald-100">{rec.title}</h4>
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Impact: {rec.impact}
                </span>
              </div>
              <p className="text-sm text-slate-300">{rec.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Questions */}
      <section className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-3">Deep Dive Questions</h2>
        <p className="text-sm text-slate-400 mb-4">Ask these in the AI Assistant tab to explore further:</p>
        <div className="flex flex-wrap gap-2">
          {suggested_questions.map((q: string, i: number) => (
            <span key={i} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-sm">
              "{q}"
            </span>
          ))}
        </div>
      </section>

    </div>
  );
}
