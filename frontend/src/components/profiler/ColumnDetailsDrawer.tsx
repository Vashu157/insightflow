"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useColumnDetails } from "@/hooks/useSessions";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function ColumnDetailsDrawer({ 
  sessionId, 
  columnName, 
  onClose 
}: { 
  sessionId: string, 
  columnName: string | null, 
  onClose: () => void 
}) {
  const { data: details, isLoading } = useColumnDetails(sessionId, columnName);

  if (!columnName) return null;

  return (
    <Sheet open={!!columnName} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl border-l-slate-800 bg-slate-950 p-0 text-slate-50 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 border-b border-slate-800 bg-slate-900/50">
          <SheetTitle className="text-2xl text-white flex items-center gap-3">
            {columnName}
            {details && <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">{details.inferred_type}</Badge>}
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Detailed statistical profile and distribution analysis.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : details ? (
            <div className="space-y-8 pb-10">
              
              {/* Common Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs text-slate-500 mb-1">Missing Values</p>
                  <p className="text-xl font-semibold text-rose-400">
                    {details.missing_count.toLocaleString()} ({details.missing_percentage}%)
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs text-slate-500 mb-1">Sample Values</p>
                  <p className="text-sm text-slate-300 truncate">
                    {details.sample_values.join(", ") || "N/A"}
                  </p>
                </div>
              </div>

              {/* Numeric Stats */}
              {details.inferred_type === 'numeric' && details.numeric_stats && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-slate-800 pb-2">Statistical Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <StatBox label="Min" value={details.numeric_stats.minimum} />
                    <StatBox label="Max" value={details.numeric_stats.maximum} />
                    <StatBox label="Mean" value={details.numeric_stats.mean.toFixed(2)} />
                    <StatBox label="Median" value={details.numeric_stats.median} />
                    <StatBox label="Std Dev" value={details.numeric_stats.std_dev.toFixed(2)} />
                    <StatBox label="Variance" value={details.numeric_stats.variance.toFixed(2)} />
                    <StatBox label="Q1" value={details.numeric_stats.q1} />
                    <StatBox label="Q3" value={details.numeric_stats.q3} />
                  </div>
                  
                  {/* Pseudo Histogram for numeric data (mocked using quartiles for visualization if full bins aren't sent) */}
                  <div className="h-64 mt-6 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <p className="text-xs text-slate-500 mb-4 text-center">Quartile Distribution</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Min-Q1', value: details.numeric_stats.q1 - details.numeric_stats.minimum },
                        { name: 'Q1-Med', value: details.numeric_stats.median - details.numeric_stats.q1 },
                        { name: 'Med-Q3', value: details.numeric_stats.q3 - details.numeric_stats.median },
                        { name: 'Q3-Max', value: details.numeric_stats.maximum - details.numeric_stats.q3 },
                      ]}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc'}} />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Categorical Stats */}
              {details.inferred_type === 'categorical' && details.categorical_stats && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-slate-800 pb-2">Frequency Distribution</h3>
                  <div className="mb-4">
                    <span className="text-slate-400">Total Unique Values: </span>
                    <span className="font-bold text-white">{details.categorical_stats.unique_count.toLocaleString()}</span>
                  </div>
                  
                  <div className="h-72 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.entries(details.categorical_stats.frequencies).map(([k, v]) => ({ name: k, count: v }))}
                        layout="vertical"
                        margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={80} tickFormatter={(val) => val.length > 10 ? val.substring(0,10)+'...' : val} />
                        <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc'}} />
                        <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Boolean Stats */}
              {details.inferred_type === 'boolean' && details.boolean_stats && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-slate-800 pb-2">Boolean Distribution</h3>
                  <div className="flex justify-around items-center h-64 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                    <ResponsiveContainer width="50%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'True/1', value: details.boolean_stats.true_count },
                            { name: 'False/0', value: details.boolean_stats.false_count }
                          ]}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f43f5e" />
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc'}} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-300">True ({details.boolean_stats.true_percentage}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-rose-500" />
                        <span className="text-slate-300">False ({details.boolean_stats.false_percentage}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Stats */}
              {details.inferred_type === 'date' && details.date_stats && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-slate-800 pb-2">Temporal Span</h3>
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <StatBox label="Earliest Date" value={new Date(details.date_stats.min_date).toLocaleDateString()} />
                    <StatBox label="Latest Date" value={new Date(details.date_stats.max_date).toLocaleDateString()} />
                    <StatBox label="Span (Days)" value={Math.round(details.date_stats.time_span_days)} />
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center text-slate-500 py-10">Profile details unavailable.</div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function StatBox({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex flex-col rounded border border-slate-800 bg-slate-900/30 p-3">
      <span className="text-xs text-slate-500 mb-1">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}
