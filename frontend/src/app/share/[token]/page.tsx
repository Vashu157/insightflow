"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { Loader2, Target, Lightbulb, FileText, Lock, BrainCircuit, AlertTriangle, Sparkles } from "lucide-react";
import InsightCard from "@/components/analyst/InsightCard";
import Link from "next/link";

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared", token],
    queryFn: async () => {
      const res = await api.get(`/share/${token}`);
      return res.data;
    },
    enabled: !!token,
    retry: 0, // Do not retry on 404; invalid tokens should fail immediately.
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-sm font-medium">Retrieving shared dashboard report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-400 space-y-4 px-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <Lock className="h-8 w-8 text-rose-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Access Link Expired or Invalid</h2>
          <p className="text-slate-400 text-sm max-w-sm">This shared report might have been removed, or the validation token has expired.</p>
        </div>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline underline-offset-4 transition-colors pt-2">
          Back to InsightFlow
        </Link>
      </div>
    );
  }

  const { session, insights } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Shared Report Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center px-6 justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">InsightFlow</span>
          </Link>
          <span className="text-[10px] font-bold font-mono text-indigo-400 tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            Read-Only Access
          </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <header className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-fit p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{session.name}</h1>
            <p className="text-slate-400 flex items-center gap-1.5 text-xs font-mono">
              <FileText className="h-3.5 w-3.5" />
              {session.filename} &bull; {session.rows?.toLocaleString()} rows &bull; {session.columns} cols
            </p>
          </div>
        </header>

        {insights?.executive_summary ? (
          <>
            {/* Executive Summary */}
            <section className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/20 p-6 sm:p-8 rounded-2xl border border-indigo-500/20 backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                <Target className="text-indigo-400 shrink-0 h-6 w-6" /> Executive Summary
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 font-mono">Overview</h3>
                    <p className="text-slate-200 text-sm leading-relaxed">{insights.executive_summary.dataset_overview}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 font-mono">Overall Health</h3>
                    <p className="text-slate-200 text-sm leading-relaxed">{insights.executive_summary.overall_health}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 font-mono">Key Observations</h3>
                    <ul className="list-disc list-inside text-slate-200 text-sm space-y-1.5">
                      {(insights.executive_summary.key_observations || []).map((obs: string, i: number) => (
                        <li key={i} className="leading-relaxed">{obs}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Key Insights */}
            {(insights.insights || []).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lightbulb className="text-amber-400 shrink-0 h-5 w-5" /> Key Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {insights.insights.map((insight: any, i: number) => (
                    <InsightCard key={`insight-${i}`} insight={insight} />
                  ))}
                </div>
              </section>
            )}

            {/* Anomalies */}
            {(insights.anomalies || []).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="text-rose-400 shrink-0 h-5 w-5" /> Anomalies & Risks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {insights.anomalies.map((insight: any, i: number) => (
                    <InsightCard key={`anomaly-${i}`} insight={insight} />
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {(insights.recommendations || []).length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-white">Strategic Recommendations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.recommendations.map((rec: any, i: number) => (
                    <div key={`rec-${i}`} className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/20 shadow-md">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="font-bold text-base text-emerald-300">{rec.title}</h3>
                        {rec.impact && (
                          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium shrink-0">
                            {rec.impact}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex min-h-[260px] flex-col items-center justify-center text-center p-6 text-slate-500">
            <Lightbulb className="mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm">No analysis has been generated for this shared report yet.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-10 pb-4 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-550">
            Report shared via{" "}
            <Link href="/" className="text-indigo-500/80 hover:text-indigo-400 transition-colors font-medium">
              InsightFlow
            </Link>
            {" "}&bull; AI-Powered Analytics
          </p>
        </footer>
      </div>
    </div>
  );
}
