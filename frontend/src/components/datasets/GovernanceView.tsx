import { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { History, RotateCcw, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
        <ShieldCheck className="h-8 w-8 text-indigo-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Data Governance & Versioning</h2>
          <p className="text-sm text-slate-400">Track data lineage and restore previous states.</p>
        </div>
      </div>

      <div className="relative border-l border-slate-800 ml-4 space-y-8">
        {versions.length === 0 ? (
          <div className="text-slate-500 pl-6">No version history available.</div>
        ) : (
          versions.map((v, idx) => (
            <div key={v.id} className="relative pl-8">
              <span className="absolute -left-3.5 top-1 h-7 w-7 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                <History className="h-3 w-3 text-indigo-400" />
              </span>
              
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Version {v.version_number}
                      {idx === 0 && <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Current</span>}
                    </h3>
                    <p className="text-sm text-slate-400">{format(new Date(v.created_at), "PPpp")} by {v.created_by}</p>
                  </div>
                  
                  {idx !== 0 && (
                    <button
                      onClick={() => handleRestore(v.id)}
                      disabled={restoring === v.id}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {restoring === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Restore
                    </button>
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                  <p className="text-sm text-slate-300"><span className="text-slate-500">Summary:</span> {v.change_summary}</p>
                  <p className="text-sm text-slate-300 mt-1"><span className="text-slate-500">Row Count:</span> {v.row_count.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
