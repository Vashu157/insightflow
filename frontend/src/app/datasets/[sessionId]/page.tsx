"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { LayoutDashboard, FileBarChart, MessageSquareText, Presentation, AlertCircle, Loader2, ShieldCheck, Download, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useDatasetProfile, useColumnSummaries, useSession } from "@/hooks/useSessions";
import { useDashboardSummary, useSavedCharts, useSaveCharts } from "@/hooks/useAnalytics";
import Navbar from "@/components/layout/Navbar";
import api from "@/lib/api";

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
          <div key={i} className="h-24 rounded-xl bg-slate-900/60 border border-slate-800" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-slate-900/60 border border-slate-800" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-900/60 border border-slate-800" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-rose-400 bg-slate-900/40 border border-rose-500/20 rounded-2xl p-6">
      <AlertCircle className="h-10 w-10 text-rose-500/60" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function DatasetWorkspacePage() {
  const params = useParams();
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

  const baseUrl = api.defaults.baseURL;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <Navbar datasetName={session?.original_filename || "Loading..."} />

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-[1400px]">
        <Tabs defaultValue="dashboard" className="w-full space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-4 border-b border-slate-800/80 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Analytics Workspace
                {session?.original_filename && (
                  <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hidden sm:inline-block">
                    {session.original_filename}
                  </span>
                )}
              </h1>
              <p className="text-slate-400 text-sm mt-1">Explore, filter, and visualize your dataset interactively.</p>
            </div>
            
            <div className="w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <TabsList className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl inline-flex w-max">
                <TabsTrigger value="dashboard" className="text-slate-400 hover:text-slate-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg text-xs font-semibold px-3 py-1.5 transition-all">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="profiler" className="text-slate-400 hover:text-slate-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg text-xs font-semibold px-3 py-1.5 transition-all">
                  <FileBarChart className="w-3.5 h-3.5 mr-1.5" /> Data Profile
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-slate-400 hover:text-slate-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg text-xs font-semibold px-3 py-1.5 transition-all">
                  <MessageSquareText className="w-3.5 h-3.5 mr-1.5" /> AI Assistant
                  <span className="ml-1.5 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">AI</span>
                </TabsTrigger>
                <TabsTrigger value="analyst" className="text-slate-400 hover:text-slate-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg text-xs font-semibold px-3 py-1.5 transition-all">
                  <Presentation className="w-3.5 h-3.5 mr-1.5" /> Business Analyst
                  <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">AI</span>
                </TabsTrigger>
                <TabsTrigger value="governance" className="text-slate-400 hover:text-slate-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg text-xs font-semibold px-3 py-1.5 transition-all">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Governance
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Profiler Tab */}
          <TabsContent value="profiler" className="space-y-8 animate-in fade-in duration-300">
            {profileLoading ? (
              <ProfilerSkeleton />
            ) : profileError ? (
              <ErrorState message="Could not load the dataset profile. The session may have expired." />
            ) : !profile ? null : (
              <>
                <DatasetSummaryCard summary={profile.summary} />
                <section className="space-y-4">
                  <h3 className="text-xl font-semibold text-white border-b border-slate-800/80 pb-3">Column Explorer</h3>
                  <ColumnExplorer columns={columns || []} onSelectColumn={setSelectedColumn} />
                </section>
                <ColumnDetailsDrawer sessionId={sessionId} columnName={selectedColumn} onClose={() => setSelectedColumn(null)} />
              </>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="animate-in fade-in duration-300">
            {dashboardLoading ? (
              <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
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
                  <div className="section-panel space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <h2 className="text-xl font-semibold text-white">Visualizations</h2>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`${baseUrl}/sessions/${sessionId}/export/excel`)}
                          className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Export Excel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`${baseUrl}/sessions/${sessionId}/export/pdf`)}
                          className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5 text-rose-400" /> Export PDF
                        </Button>
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
                  <div className="section-panel space-y-4">
                    <h2 className="text-xl font-semibold text-white">Dataset View</h2>
                    <DataTable sessionId={sessionId} globalFilters={globalFilters} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="animate-in fade-in duration-300 min-h-[600px] h-auto lg:h-[720px]">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              <div className="w-full lg:w-1/3 min-w-[320px]">
                <ChatInterface
                  history={chatHistory || []}
                  onSend={sendQuery}
                  isLoading={isQuerying}
                  onSelectMessage={setSelectedAiMessage}
                />
              </div>
              <div className="flex-1 border border-slate-800 bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 overflow-hidden min-w-0 min-h-[400px]">
                {!selectedAiMessage ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <MessageSquareText className="h-8 w-8" />
                    </div>
                    <p className="text-base font-medium text-slate-200">Ask a question in the chat to see results here</p>
                    <p className="text-xs text-slate-500 max-w-sm text-center">
                      Generate DuckDB SQL queries dynamically and inspect data tables & charts.
                    </p>
                  </div>
                ) : (
                  <ChatResults message={selectedAiMessage} sessionId={sessionId} />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Business Analyst Tab */}
          <TabsContent value="analyst" keepMounted className="animate-in fade-in duration-300 data-[state=inactive]:hidden">
            <AnalystView sessionId={sessionId} />
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="animate-in fade-in duration-300">
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

