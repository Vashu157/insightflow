"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Activity, Server, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, statusRes] = await Promise.all([
          api.get("/api/v1/admin/analytics"),
          api.get("/api/v1/admin/status")
        ]);
        setAnalytics(analyticsRes.data);
        setStatus(statusRes.data);
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const chartData = analytics?.action_distribution 
    ? Object.entries(analytics.action_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <Navbar />
      
      <main className="container mx-auto px-6 py-8 max-w-[1200px] animate-in fade-in duration-500">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
          <ShieldCheck className="h-8 w-8 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Enterprise Administration</h1>
            <p className="text-slate-400 text-sm">Monitor system health, usage metrics, and background jobs.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><span className="text-slate-500 animate-pulse">Loading dashboard...</span></div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-400">Total Actions</h3>
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white">{analytics?.total_actions || 0}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-400">Avg Response Time</h3>
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white">{analytics?.average_duration_ms?.toFixed(0) || 0} ms</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-400">Running Jobs</h3>
                  <Server className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-bold text-white">{status?.summary.running_jobs_count || 0}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-400">Circuit Breaker</h3>
                  <AlertTriangle className={`h-4 w-4 ${status?.summary.gemini_circuit_breaker === 'closed' ? 'text-emerald-400' : 'text-rose-500'}`} />
                </div>
                <div className="text-xl font-bold text-white capitalize">{status?.summary.gemini_circuit_breaker}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analytics Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Action Distribution</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Failures & Queue */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Recent Job Failures</h3>
                <div className="flex-1 overflow-auto space-y-3">
                  {status?.recent_failures?.length === 0 ? (
                    <div className="text-center text-slate-500 mt-10">No recent failures detected.</div>
                  ) : (
                    status?.recent_failures?.map((fail: any) => (
                      <div key={fail.job_id} className="p-3 bg-slate-950 rounded-lg border border-rose-900/50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-rose-400">{fail.job_type}</span>
                          <span className="text-xs text-slate-500">{new Date(fail.failed_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-mono break-all">{fail.error_message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
