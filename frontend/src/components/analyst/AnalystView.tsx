"use client";

import { useInsights, useRefreshInsights } from "@/hooks/useInsights";
import { useJobWebSocket } from "@/hooks/useWebSocket";
import { Loader2, RefreshCw, FileText, Target, AlertTriangle, Lightbulb, Share2, Download, Copy, CheckCircle, AlertCircle } from "lucide-react";
import InsightCard from "./InsightCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AnalystView({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useInsights(sessionId);
  const { mutate: refresh } = useRefreshInsights(sessionId);
  const [isSharing, setIsSharing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("Started");
  
  const { jobStatus } = useJobWebSocket(sessionId);

  // Listen to WebSocket updates
  useEffect(() => {
    if (jobStatus?.payload && jobStatus.event_type.startsWith("report.")) {
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
  }, [jobStatus, refetch]);

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
      <div className="flex flex-col items-center justify-center h-[600px] text-slate-400 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-lg font-medium">{currentStage}...</p>
        <p className="text-sm opacity-70">The AI is generating your business report. Please wait.</p>
        <div className="w-64 max-w-sm mt-4">
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    // If it's a 404, it just means the report hasn't been generated yet.
    const errStatus = (error as any)?.response?.status || (error as any)?.status;
    const errMsg = String((error as any)?.message || error);
    const isNotFound = errStatus === 404 || errMsg.includes("404");
    
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        {isNotFound ? (
          <FileText className="h-12 w-12 text-slate-500/50" />
        ) : (
          <AlertCircle className="h-12 w-12 text-rose-500/50" />
        )}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-1">
            {isNotFound ? "No Business Report Found" : "Report Generation Failed"}
          </h3>
          <p className="text-sm text-slate-400">
            {isNotFound 
              ? "Generate a comprehensive AI business report to uncover deep insights." 
              : "Could not generate the business report. Check your API key configuration."}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700 mt-2">
          {isNotFound ? <Lightbulb className="h-4 w-4 mr-2 text-amber-400" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {isNotFound ? "Generate Report" : "Try Again"}
        </Button>
      </div>
    );
  }

  const { report, generated_at, is_cached } = data;
  const { executive_summary, insights, anomalies, recommendations, suggested_questions } = report;

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Actions */}
      <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
          <span className="text-sm text-slate-300">
            Generated {new Date(generated_at).toLocaleString()}
            {is_cached && <span className="ml-2 text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">Cached</span>}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleShare} disabled={isSharing} variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
            {isSharing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
            Share
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Regenerate
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 p-6 rounded-2xl border border-indigo-500/20">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="text-indigo-400 shrink-0" /> Executive Summary
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
                {(executive_summary.key_observations || []).map((obs: string, i: number) => <li key={i}>{obs}</li>)}
              </ul>
            </div>
            {(executive_summary.data_quality_issues || []).length > 0 && (
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

      {/* Key Insights */}
      {(insights || []).length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="text-amber-400 shrink-0" /> Key Insights
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
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-rose-400 shrink-0" /> Anomalies & Risks
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
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Strategic Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec: any, i: number) => (
              <div key={`rec-${i}`} className="bg-slate-900/50 p-5 rounded-xl border border-emerald-500/20">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h4 className="font-semibold text-emerald-100">{rec.title}</h4>
                  <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{rec.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggested Questions */}
      {(suggested_questions || []).length > 0 && (
        <section className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-1">Deep Dive Questions</h2>
          <p className="text-sm text-slate-400 mb-4">Click any question to copy it, then ask it in the AI Assistant tab.</p>
          <div className="flex flex-wrap gap-2">
            {suggested_questions.map((q: string, i: number) => (
              <button
                key={i}
                onClick={() => {
                  navigator.clipboard.writeText(q);
                  toast.success("Question copied to clipboard!");
                }}
                className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-sm hover:bg-indigo-500/20 hover:border-indigo-400/40 transition-colors cursor-pointer text-left"
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
