import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LayoutGrid, HardDrive, Files, AlertTriangle, ShieldAlert, BadgeCheck, Activity } from "lucide-react";

export default function DatasetSummaryCard({ summary }: { summary: any }) {
  if (!summary) return null;

  const metrics = [
    { label: "Total Rows", value: summary.total_rows.toLocaleString(), icon: LayoutGrid, color: "text-blue-400" },
    { label: "Total Columns", value: summary.total_columns.toLocaleString(), icon: Database, color: "text-indigo-400" },
    { label: "Memory Usage", value: `${summary.memory_usage_mb} MB`, icon: HardDrive, color: "text-purple-400" },
    { label: "Missing Values", value: `${summary.missing_values.toLocaleString()} (${summary.missing_percentage}%)`, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Duplicate Rows", value: summary.duplicate_rows.toLocaleString(), icon: Files, color: "text-rose-400" },
    { 
      label: "Quality Score", 
      value: summary.quality_score !== undefined ? `${summary.quality_score.toFixed(1)}/100` : "N/A", 
      icon: summary.quality_score >= 80 ? BadgeCheck : ShieldAlert, 
      color: summary.quality_score >= 80 ? "text-emerald-400" : "text-amber-400" 
    },
  ];

  return (
    <Card className="border-indigo-500/20 bg-slate-900/60 backdrop-blur-2xl shadow-xl">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          Dataset Overview & Health Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/80">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 truncate pr-1">{m.label}</span>
                <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
                  <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight">{m.value}</span>
            </div>
          ))}
        </div>

        {summary.quality_issues && summary.quality_issues.length > 0 && (
          <div className="border border-rose-500/30 bg-rose-500/10 backdrop-blur-md rounded-2xl p-4 sm:p-5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-300 mb-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" /> Data Quality Anomalies Identified
            </h4>
            <ul className="list-disc list-inside text-xs sm:text-sm text-slate-200 space-y-1 ml-1">
              {summary.quality_issues.map((issue: string, idx: number) => (
                <li key={idx} className="leading-relaxed">{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

