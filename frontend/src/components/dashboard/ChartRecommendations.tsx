import { useState, useEffect } from "react";
import { Sparkles, PlusCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function ChartRecommendations({ 
  sessionId, 
  onAddChart 
}: { 
  sessionId: string, 
  onAddChart: (config: any) => void 
}) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}/recommendations`);
        setRecommendations(res.data);
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [sessionId]);

  if (loading) return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
    </div>
  );

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-slate-900/40 border border-amber-500/20 backdrop-blur-md rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">AI Suggested Visualizations</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {recommendations.map((rec, idx) => (
          <button
            type="button"
            key={idx} 
            className="group relative bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 hover:border-amber-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left focus-ring"
            onClick={() => onAddChart(rec)}
          >
            <div>
              <h4 className="text-xs font-semibold text-amber-300 mb-1">{rec.title}</h4>
              <p className="text-[11px] font-mono text-slate-400 capitalize">{rec.chart_type} - {rec.x_axis} vs {rec.y_axis}</p>
              <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">{rec.explanation}</p>
            </div>
            
            <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center rounded-xl">
              <span className="bg-amber-500 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                <PlusCircle className="h-3.5 w-3.5" /> Add to Dashboard
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
