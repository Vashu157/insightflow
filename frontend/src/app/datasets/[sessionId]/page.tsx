"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BrainCircuit, ArrowLeft, LayoutDashboard, FileBarChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDatasetProfile, useColumnSummaries } from "@/hooks/useSessions";
import { useDashboardSummary, useSavedCharts, useSaveCharts } from "@/hooks/useAnalytics";

// Profiler Components
import DatasetSummaryCard from "@/components/profiler/DatasetSummaryCard";
import ColumnExplorer from "@/components/profiler/ColumnExplorer";
import ColumnDetailsDrawer from "@/components/profiler/ColumnDetailsDrawer";

// Dashboard Components
import FilterSidebar from "@/components/dashboard/FilterSidebar";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import ChartBuilderDialog from "@/components/dashboard/ChartBuilderDialog";
import DataTable from "@/components/dashboard/DataTable";

// AI Assistant Components
import ChatInterface from "@/components/ai/ChatInterface";
import ChatResults from "@/components/ai/ChatResults";
import { useChatHistory, useQueryAI } from "@/hooks/useAI";
import { MessageSquareText, Presentation } from "lucide-react";

// AI Analyst Component
import AnalystView from "@/components/analyst/AnalystView";

export default function DatasetWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // Profiler State
  const { data: profile } = useDatasetProfile(sessionId);
  const { data: columns } = useColumnSummaries(sessionId);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Dashboard State
  const { data: dashboardSummary } = useDashboardSummary(sessionId);
  const { data: savedCharts } = useSavedCharts(sessionId);
  const { mutate: saveCharts } = useSaveCharts(sessionId);
  
  const [globalFilters, setGlobalFilters] = useState<any[]>([]);

  // AI State
  const { data: chatHistory } = useChatHistory(sessionId);
  const { mutate: sendQuery, isPending: isQuerying } = useQueryAI(sessionId);
  const [selectedAiMessage, setSelectedAiMessage] = useState<any>(null);

  const handleAddChart = (chart: any) => {
    const current = savedCharts || [];
    saveCharts([...current, chart]);
  };

  const handleChartsChange = (newCharts: any[]) => {
    saveCharts(newCharts);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white cursor-pointer" onClick={() => router.push('/')}>
              InsightFlow
            </span>
          </div>
          <div className="ml-auto flex gap-4 text-sm font-medium text-slate-400">
            <a href="/datasets" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Upload
            </a>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-6 max-w-[1400px]">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Analytics Workspace</h1>
              <p className="text-slate-400">Explore, filter, and visualize your dataset interactively.</p>
            </div>
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="profiler" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <FileBarChart className="w-4 h-4 mr-2" /> Data Profile
              </TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <MessageSquareText className="w-4 h-4 mr-2" /> AI Assistant
              </TabsTrigger>
              <TabsTrigger value="analyst" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Presentation className="w-4 h-4 mr-2" /> Business Analyst
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profiler" className="space-y-8 animate-in fade-in duration-500 mt-6">
            {!profile ? (
              <div className="flex h-64 items-center justify-center text-slate-500">Loading Profile...</div>
            ) : (
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

          <TabsContent value="dashboard" className="animate-in fade-in duration-500 mt-6">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Sidebar Filters */}
              {dashboardSummary && (
                <FilterSidebar 
                  columns={[...dashboardSummary.numeric_columns, ...dashboardSummary.categorical_columns, ...dashboardSummary.datetime_columns]} 
                  filters={globalFilters} 
                  onFiltersChange={setGlobalFilters} 
                />
              )}

              {/* Main Dashboard Area */}
              <div className="flex-1 space-y-6">
                
                {/* Visualizations Section */}
                <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Visualizations</h2>
                    {dashboardSummary && (
                      <ChartBuilderDialog 
                        columns={[...dashboardSummary.numeric_columns, ...dashboardSummary.categorical_columns, ...dashboardSummary.datetime_columns]}
                        numericColumns={dashboardSummary.numeric_columns}
                        categoricalColumns={dashboardSummary.categorical_columns}
                        onSave={handleAddChart}
                      />
                    )}
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

                {/* Raw Data Table Section */}
                <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-4">
                  <h2 className="text-xl font-semibold text-white mb-4">Dataset View</h2>
                  <DataTable sessionId={sessionId} globalFilters={globalFilters} />
                </div>

              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="animate-in fade-in duration-500 mt-6 h-[700px]">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Left Side: Chat Timeline */}
              <div className="w-full lg:w-1/3 min-w-[350px]">
                <ChatInterface 
                  history={chatHistory || []} 
                  onSend={sendQuery}
                  isLoading={isQuerying}
                  onSelectMessage={setSelectedAiMessage}
                />
              </div>

              {/* Right Side: Results & Explanation */}
              <div className="flex-1 border border-slate-800 bg-slate-900/30 rounded-xl p-6 overflow-hidden">
                {!selectedAiMessage ? (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    <p>Ask a question or select a past message to see results here.</p>
                  </div>
                ) : (
                  <ChatResults message={selectedAiMessage} />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analyst" className="animate-in fade-in duration-500 mt-6">
            <AnalystView sessionId={sessionId} />
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
