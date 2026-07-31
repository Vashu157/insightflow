"use client";

import { useInsights, useRefreshInsights } from "@/hooks/useInsights";
import { useJobWebSocket } from "@/hooks/useWebSocket";
import { Loader2, RefreshCw, FileText, Target, AlertTriangle, Lightbulb, Share2, Download, AlertCircle, Sparkles } from "lucide-react";
import InsightCard from "./InsightCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/lib/api";

import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AnalystView({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useInsights(sessionId);
  const { mutate: refresh } = useRefreshInsights(sessionId);
  const [isSharing, setIsSharing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("Started");
  
  const { jobStatus } = useJobWebSocket(sessionId);

  // Check for active job on mount
  useEffect(() => {
    const checkActiveJob = async () => {
      try {
        const res = await api.get(`/jobs/session/${sessionId}/active`);
        if (res.data && res.data.job_type === "REPORT_GENERATION") {
          setIsRefreshing(true);
          setProgress(res.data.progress || 0);
          setCurrentStage(res.data.status === "QUEUED" ? "Queued" : "Running");
        }
      } catch (err) {
        // No active job found
      }
    };
    checkActiveJob();
  }, [sessionId]);

  // Listen to WebSocket updates
  useEffect(() => {
    if (jobStatus?.payload && jobStatus.event_type.startsWith("report.")) {
      if (jobStatus.payload.status === "RUNNING") {
        setIsRefreshing(true);
      }
      if (jobStatus.payload.progress !== undefined) {
        setProgress(jobStatus.payload.progress);
      }
      if (jobStatus.payload.current_stage) {
        setCurrentStage(jobStatus.payload.current_stage);
      }
      
      if (jobStatus.payload.status === "COMPLETED") {
        queryClient.invalidateQueries({ queryKey: ["insights", sessionId] });
        setIsRefreshing(false);
        toast.success("Business report generated successfully!");
      } else if (jobStatus.payload.status === "FAILED") {
        toast.error(`Processing failed: ${jobStatus.payload.error_message}`);
        setIsRefreshing(false);
      }
    }
  }, [jobStatus, sessionId, queryClient]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const response = await api.post(`/sessions/${sessionId}/share`);
      const shareUrl = `${window.location.origin}/share/${response.data.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Failed to generate share link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleExport = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.open(`${baseUrl}/sessions/${sessionId}/export/report`, '_blank');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setProgress(0);
    setCurrentStage("Queued");
    refresh(undefined, {
      onError: () => {
        setIsRefreshing(false);
        toast.error("Failed to queue report generation.");
      },
    });
  };

  if (isLoading || isRefreshing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-slate-400 space-y-5 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 p-8">
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-bold text-white tracking-tight">{currentStage}...</p>
          <p className="text-xs text-slate-400">Gemini AI is analyzing dataset patterns & synthesizing executive insights.</p>
        </div>
        <div className="w-full max-w-sm space-y-2 pt-2">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const errStatus = (error as any)?.response?.status || (error as any)?.status;
    const errMsg = String((error as any)?.message || error);
    const isNotFound = errStatus === 404 || errMsg.includes("404");
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center">
        {isNotFound ? (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="h-8 w-8" />
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertCircle className="h-8 w-8" />
          </div>
        )}
        <div className="max-w-md space-y-1">
          <h3 className="text-xl font-bold text-white">
            {isNotFound ? "No Executive Business Report Generated Yet" : "Report Generation Encountered an Error"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isNotFound 
              ? "Generate an automated AI report uncovering key findings, anomaly warnings, and strategic recommendations." 
              : "Could not generate the business report. Check your AI service configuration or try again."}
          </p>
        </div>
        <Button onClick={handleRefresh} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2 rounded-xl shadow-lg mt-2">
          {isNotFound ? <Sparkles className="h-4 w-4 mr-2 text-amber-300" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {isNotFound ? "Generate Business Report" : "Retry Report Generation"}
        </Button>
      </div>
    );
  }

  const { report, generated_at, is_cached } = data;
  const { executive_summary, insights, anomalies, recommendations, suggested_questions } = report;

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Actions */}
      <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur-2xl p-4 rounded-2xl border border-slate-800 flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-300 block">
              Generated {new Date(generated_at).toLocaleString()}
            </span>
            {is_cached && <span className="text-[10px] text-indigo-400 font-mono">Server Cached Response</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleShare} disabled={isSharing} variant="outline" size="sm" className="bg-slate-900 border-slate-700 hover:bg-slate-800">
            {isSharing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5 mr-1.5" />}
            Share Link
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" className="bg-slate-900 border-slate-700 hover:bg-slate-800">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Report
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-slate-900 border-slate-700 hover:bg-slate-800"
          >
            {isRefreshing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Regenerate
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/20 p-6 sm:p-8 rounded-2xl border border-indigo-500/20 backdrop-blur-xl shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Target className="text-indigo-400 shrink-0 h-6 w-6" /> Executive Summary
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 font-mono">Dataset Overview</h3>
              <p className="text-slate-200 text-sm leading-relaxed">{executive_summary.dataset_overview}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 font-mono">Overall Health</h3>
              <p className="text-slate-200 text-sm leading-relaxed">{executive_summary.overall_health}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 font-mono">Key Observations</h3>
              <ul className="list-disc list-inside text-slate-200 text-sm space-y-1.5">
                {(executive_summary.key_observations || []).map((obs: string, i: number) => <li key={i} className="leading-relaxed">{obs}</li>)}
              </ul>
            </div>
            {(executive_summary.data_quality_issues || []).length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 font-mono">Quality Concerns</h3>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                  {executive_summary.data_quality_issues.map((iss: string, i: number) => <li key={i}>{iss}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Key Insights */}
      {(insights || []).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="text-amber-400 shrink-0 h-5 w-5" /> Key Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {insights.map((insight: any, i: number) => (
              <InsightCard key={`insight-${i}`} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* Anomalies */}
      {(anomalies || []).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-rose-400 shrink-0 h-5 w-5" /> Anomalies & Risks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {anomalies.map((anomaly: any, i: number) => (
              <InsightCard key={`anomaly-${i}`} insight={anomaly} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {(recommendations || []).length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Strategic Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec: any, i: number) => (
              <div key={`rec-${i}`} className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/20 shadow-md">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h4 className="font-bold text-base text-emerald-300">{rec.title}</h4>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium shrink-0">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{rec.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggested Questions */}
      {(suggested_questions || []).length > 0 && (
        <section className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white">Suggested Deep-Dive Questions</h2>
          <p className="text-xs text-slate-400">Click any question to copy it to your clipboard for the AI Assistant.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {suggested_questions.map((q: string, i: number) => (
              <button
                key={i}
                onClick={() => {
                  navigator.clipboard.writeText(q);
                  toast.success("Question copied to clipboard!");
                }}
                className="px-3.5 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-medium hover:bg-indigo-500/20 hover:border-indigo-400/40 transition-all text-left focus-ring"
              >
                {q}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

