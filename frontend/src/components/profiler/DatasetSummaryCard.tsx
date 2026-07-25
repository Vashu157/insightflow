import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LayoutGrid, HardDrive, Files, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DatasetSummaryCard({ summary }: { summary: any }) {
  if (!summary) return null;

  const metrics = [
    { label: "Total Rows", value: summary.total_rows.toLocaleString(), icon: LayoutGrid, color: "text-blue-400" },
    { label: "Total Columns", value: summary.total_columns.toLocaleString(), icon: Database, color: "text-indigo-400" },
    { label: "Memory Usage", value: `${summary.memory_usage_mb} MB`, icon: HardDrive, color: "text-purple-400" },
    { label: "Missing Values", value: `${summary.missing_values.toLocaleString()} (${summary.missing_percentage}%)`, icon: AlertTriangle, color: "text-amber-400" },
    { label: "Duplicate Rows", value: summary.duplicate_rows.toLocaleString(), icon: Files, color: "text-rose-400" },
    { label: "Uploaded", value: formatDistanceToNow(new Date(summary.upload_time), { addSuffix: true }), icon: Clock, color: "text-emerald-400" },
  ];

  return (
    <Card className="border-indigo-500/20 bg-slate-900/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl text-white">Dataset Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-slate-800 bg-slate-800/30 p-4 transition-all hover:bg-slate-800/50">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{m.label}</span>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <span className="text-xl font-bold text-white">{m.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
