import { useState, useEffect } from "react";
import axios from "axios";
import { Sparkles, PlusCircle, Loader2 } from "lucide-react";

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
        const res = await axios.get(`http://localhost:8000/api/v1/sessions/${sessionId}/recommendations`);
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
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
    </div>
  );

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 shadow-lg mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">AI Suggested Charts</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((rec, idx) => (
          <div 
            key={idx} 
            className="group relative bg-slate-950 border border-slate-800 rounded-lg p-3 hover:border-indigo-500/50 transition-colors cursor-pointer flex flex-col justify-between"
            onClick={() => onAddChart(rec)}
          >
            <div>
              <h4 className="text-xs font-semibold text-indigo-400 mb-1">{rec.title}</h4>
              <p className="text-[10px] text-slate-400 capitalize">{rec.chart_type} • {rec.x_axis} vs {rec.y_axis}</p>
              <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">{rec.explanation}</p>
            </div>
            
            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                <PlusCircle className="h-3 w-3" /> Add
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
