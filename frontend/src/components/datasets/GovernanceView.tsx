"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { History, RotateCcw, ShieldCheck, Loader2, ArrowRight, Layers, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function GovernanceView({ sessionId }: { sessionId: string }) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchVersions = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}/versions`);
      setVersions(res.data);
    } catch (error) {
      console.error("Failed to fetch versions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [sessionId]);

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      await api.post(`/sessions/${sessionId}/versions/${versionId}/restore`);
      toast.success("Dataset version restored successfully.");
      fetchVersions();
    } catch (error) {
      toast.error("Failed to restore version");
      console.error(error);
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80">
        <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3.5 pb-5 border-b border-slate-850">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-md">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Data Governance & Version Control
          </h2>
          <p className="text-xs text-slate-400 mt-1">Track data lineage snapshots, inspect schema state changes, and restore previous uploads.</p>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-800/80 ml-6 space-y-8 pl-8 pt-2">
        {versions.length === 0 ? (
          <div className="text-slate-500 text-sm italic">No dataset version history has been generated.</div>
        ) : (
          versions.map((v, idx) => {
            const isCurrent = idx === 0;
            return (
              <div key={v.id} className="relative group">
                {/* Node icon on line */}
                <span className={`absolute -left-[45px] top-1.5 h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                  isCurrent 
                    ? "bg-indigo-600 border border-indigo-400 text-white shadow-lg shadow-indigo-600/35" 
                    : "bg-slate-950 border border-slate-800 text-slate-400 group-hover:border-indigo-500/40"
                }`}>
                  {isCurrent ? <ShieldCheck className="h-4 w-4" /> : <History className="h-4 w-4" />}
                </span>
                
                <div className={`bg-slate-900/40 backdrop-blur-md border rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-300 ${
                  isCurrent 
                    ? "border-indigo-500/20 bg-indigo-950/5 shadow-indigo-950/20" 
                    : "border-slate-850 hover:border-slate-700/80"
                }`}>
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          Version {v.version_number}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25 tracking-wide">
                            Active Release
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Committed {format(new Date(v.created_at), "PPpp")} by <span className="font-mono text-indigo-300 font-medium">{v.created_by}</span>
                      </p>
                    </div>
                    
                    {!isCurrent && (
                      <Button
                        onClick={() => handleRestore(v.id)}
                        disabled={restoring === v.id}
                        variant="outline"
                        size="sm"
                        className="bg-slate-950/60 border-slate-800 text-xs font-semibold hover:bg-slate-900 rounded-xl"
                      >
                        {restoring === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
                        Restore to Active
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-900/60 text-xs leading-relaxed text-slate-300">
                    <div className="space-y-1">
                      <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold block">Change Summary</span>
                      <p className="font-medium text-slate-200">{v.change_summary}</p>
                    </div>
                    <div className="space-y-1 flex items-center justify-between sm:justify-start sm:gap-8 border-t sm:border-t-0 sm:border-l border-slate-850 pt-2.5 sm:pt-0 sm:pl-6">
                      <div>
                        <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold block mb-0.5">Rows count</span>
                        <span className="font-semibold text-slate-200 font-mono">{v.row_count.toLocaleString()}</span>
                      </div>
                      {v.schema_snapshot && (
                        <div>
                          <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold block mb-0.5">Columns count</span>
                          <span className="font-semibold text-slate-200 font-mono">
                            {Object.keys(v.schema_snapshot).length} cols
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
