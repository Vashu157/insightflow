"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { Loader2, Target, Lightbulb, FileText, Lock, BrainCircuit } from "lucide-react";
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
    retry: 0, // Don't retry on 404 — invalid tokens should fail immediately
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p>Loading shared report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-rose-400 space-y-4">
        <Lock className="h-12 w-12 text-rose-500/50" />
        <h2 className="text-2xl font-bold">Report Unavailable</h2>
        <p className="text-slate-400 text-sm">This shared report is invalid, expired, or has been removed.</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors mt-4">
          ← Back to InsightFlow
        </Link>
      </div>
    );
  }

  const { session, insights } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Shared Report Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center px-6 justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
              <BrainCircuit className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">InsightFlow</span>
          </Link>
          <span className="text-xs text-slate-500 uppercase font-bold tracking-widest border border-slate-700 px-2 py-1 rounded">
            Read-Only Report
          </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
        {/* Header */}
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{session.name}</h1>
          <p className="text-slate-400 flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 shrink-0" />
            {session.filename} &bull; {session.rows?.toLocaleString()} rows &bull; {session.columns} columns
          </p>
        </header>

        {insights?.executive_summary ? (
          <>
            {/* Executive Summary */}
            <section className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 p-6 rounded-2xl border border-indigo-500/20">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="text-indigo-400 shrink-0" /> Executive Summary
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Overview</h3>
                    <p className="text-slate-200 leading-relaxed">{insights.executive_summary.dataset_overview}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall Health</h3>
                    <p className="text-slate-200 leading-relaxed">{insights.executive_summary.overall_health}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Observations</h3>
                    <ul className="list-disc list-inside text-slate-200 space-y-1">
                      {(insights.executive_summary.key_observations || []).map((obs: string, i: number) => (
                        <li key={i}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Key Insights */}
            {(insights.insights || []).length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="text-amber-400 shrink-0" /> Key Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {insights.insights.map((insight: any, i: number) => (
                    <InsightCard key={`insight-${i}`} insight={insight} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="text-center text-slate-500 py-20">
            <p>No AI analysis was generated for this session.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-10 pb-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-600">
            Shared via{" "}
            <Link href="/" className="text-indigo-500/60 hover:text-indigo-400 transition-colors">
              InsightFlow
            </Link>
            {" "}· AI-Powered Analytics Platform
          </p>
        </footer>
      </div>
    </div>
  );
}
