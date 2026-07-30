"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, ArrowLeft, LayoutDashboard, FileBarChart, MessageSquareText, Presentation, Clock, AlertCircle, Loader2, ShieldCheck, Download, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDatasetProfile, useColumnSummaries, useSession } from "@/hooks/useSessions";
import { useDashboardSummary, useSavedCharts, useSaveCharts } from "@/hooks/useAnalytics";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/layout/Navbar";

// Profiler Components
import DatasetSummaryCard from "@/components/profiler/DatasetSummaryCard";
import ColumnExplorer from "@/components/profiler/ColumnExplorer";
import ColumnDetailsDrawer from "@/components/profiler/ColumnDetailsDrawer";
import GovernanceView from "@/components/datasets/GovernanceView";

// Dashboard Components
import FilterSidebar from "@/components/dashboard/FilterSidebar";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import ChartBuilderDialog from "@/components/dashboard/ChartBuilderDialog";
import DataTable from "@/components/dashboard/DataTable";
import ChartRecommendations from "@/components/dashboard/ChartRecommendations";

// AI Assistant Components
import ChatInterface from "@/components/ai/ChatInterface";
import ChatResults from "@/components/ai/ChatResults";
import { useChatHistory, useQueryAI } from "@/hooks/useAI";

// AI Analyst Component
import AnalystView from "@/components/analyst/AnalystView";

function ProfilerSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-800/60" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-slate-800/60" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-800/60" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-rose-400">
      <AlertCircle className="h-10 w-10 text-rose-500/50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function DatasetWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // Session metadata for expiry display
  const { data: session } = useSession(sessionId);

  // Profiler State
  const { data: profile, isLoading: profileLoading, error: profileError } = useDatasetProfile(sessionId);
  const { data: columns } = useColumnSummaries(sessionId);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Dashboard State
  const { data: dashboardSummary, isLoading: dashboardLoading } = useDashboardSummary(sessionId);
  const { data: savedCharts } = useSavedCharts(sessionId);
  const { mutate: saveCharts } = useSaveCharts(sessionId);
  const [globalFilters, setGlobalFilters] = useState<any[]>([]);

  // AI State
  const { data: chatHistory } = useChatHistory(sessionId);
  const { mutate: sendQuery, isPending: isQuerying } = useQueryAI(sessionId);
  const [selectedAiMessage, setSelectedAiMessage] = useState<any>(null);

  const allColumns = useMemo(
    () => dashboardSummary
      ? [...dashboardSummary.numeric_columns, ...dashboardSummary.categorical_columns, ...dashboardSummary.datetime_columns]
      : [],
    [dashboardSummary]
  );

  const handleAddChart = (chart: any) => {
    const current = savedCharts || [];
    saveCharts([...current, chart]);
  };

  const handleChartsChange = (newCharts: any[]) => {
    saveCharts(newCharts);
  };



  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <Navbar datasetName={session?.original_filename || "Loading..."} />

      <main className="container mx-auto px-6 py-6 max-w-[1400px]">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Analytics Workspace</h1>
              <p className="text-slate-400 text-sm">Explore, filter, and visualize your dataset interactively.</p>
            </div>
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="dashboard" className="text-slate-400 hover:text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="profiler" className="text-slate-400 hover:text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <FileBarChart className="w-4 h-4 mr-2" /> Data Profile
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-slate-400 hover:text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <MessageSquareText className="w-4 h-4 mr-2" /> AI Assistant
              </TabsTrigger>
              <TabsTrigger value="analyst" className="text-slate-400 hover:text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Presentation className="w-4 h-4 mr-2" /> Business Analyst
              </TabsTrigger>
              <TabsTrigger value="governance" className="text-slate-400 hover:text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <ShieldCheck className="w-4 h-4 mr-2" /> Governance
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profiler Tab */}
          <TabsContent value="profiler" className="space-y-8 animate-in fade-in duration-500 mt-6">
            {profileLoading ? (
              <ProfilerSkeleton />
            ) : profileError ? (
              <ErrorState message="Could not load the dataset profile. The session may have expired." />
            ) : !profile ? null : (
              <>
                <DatasetSummaryCard summary={profile.summary} />
                <section className="space-y-4">
                  <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">Column Explorer</h3>
                  <ColumnExplorer columns={columns || []} onSelectColumn={setSelectedColumn} />
                </section>
                <ColumnDetailsDrawer sessionId={sessionId} columnName={selectedColumn} onClose={() => setSelectedColumn(null)} />
              </>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="animate-in fade-in duration-500 mt-6">
            {dashboardLoading ? (
              <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <span>Loading dashboard data...</span>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Filters */}
                {dashboardSummary && (
                  <FilterSidebar
                    columns={allColumns}
                    filters={globalFilters}
                    onFiltersChange={setGlobalFilters}
                  />
                )}

                {/* Main Dashboard Area */}
                <div className="flex-1 space-y-6 min-w-0">
                  {/* AI Recommendations */}
                  <ChartRecommendations sessionId={sessionId} onAddChart={handleAddChart} />

                  {/* Visualizations Section */}
                  <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-white">Visualizations</h2>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => window.open(`http://localhost:8000/api/v1/sessions/${sessionId}/export/excel`)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20 transition-colors"
                        >
                          <FileText className="h-4 w-4" /> Export Excel
                        </button>
                        <button
                          onClick={() => window.open(`http://localhost:8000/api/v1/sessions/${sessionId}/export/pdf`)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md hover:bg-rose-500/20 transition-colors"
                        >
                          <Download className="h-4 w-4" /> Export PDF
                        </button>
                        {dashboardSummary && (
                          <ChartBuilderDialog
                            columns={allColumns}
                            numericColumns={dashboardSummary.numeric_columns}
                            categoricalColumns={dashboardSummary.categorical_columns}
                            onSave={handleAddChart}
                          />
                        )}
                      </div>
                    </div>
                    <div className="min-h-[400px]">
                      <DashboardGrid
                        sessionId={sessionId}
                        charts={savedCharts || []}
                        onChartsChange={handleChartsChange}
                        globalFilters={globalFilters}
                      />
                    </div>
                  </div>

                  {/* Raw Data Table */}
                  <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-4">
                    <h2 className="text-xl font-semibold text-white mb-4">Dataset View</h2>
                    <DataTable sessionId={sessionId} globalFilters={globalFilters} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="animate-in fade-in duration-500 mt-6 h-[700px]">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              <div className="w-full lg:w-1/3 min-w-[320px]">
                <ChatInterface
                  history={chatHistory || []}
                  onSend={sendQuery}
                  isLoading={isQuerying}
                  onSelectMessage={setSelectedAiMessage}
                />
              </div>
              <div className="flex-1 border border-slate-800 bg-slate-900/30 rounded-xl p-6 overflow-hidden min-w-0">
                {!selectedAiMessage ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                    <MessageSquareText className="h-12 w-12 text-slate-700" />
                    <p className="text-sm">Ask a question in the chat to see results here.</p>
                  </div>
                ) : (
                  <ChatResults message={selectedAiMessage} sessionId={sessionId} />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Business Analyst Tab */}
          <TabsContent value="analyst" className="animate-in fade-in duration-500 mt-6">
            <AnalystView sessionId={sessionId} />
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="animate-in fade-in duration-500 mt-6">
            <GovernanceView sessionId={sessionId} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 flex justify-center overflow-hidden">
        <div className="absolute top-0 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>
    </div>
  );
}
