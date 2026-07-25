"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BrainCircuit, ArrowLeft } from "lucide-react";
import { useDatasetProfile, useColumnSummaries } from "@/hooks/useSessions";
import DatasetSummaryCard from "@/components/profiler/DatasetSummaryCard";
import ColumnExplorer from "@/components/profiler/ColumnExplorer";
import ColumnDetailsDrawer from "@/components/profiler/ColumnDetailsDrawer";

export default function DatasetProfilePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useDatasetProfile(sessionId);
  const { data: columns, isLoading: isColumnsLoading } = useColumnSummaries(sessionId);

  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Data Profiling Engine
          </h1>
          <p className="text-slate-400">
            Automatic insights, data types, missing value detection, and advanced statistics for your dataset.
          </p>
        </div>

        {isProfileLoading || isColumnsLoading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-indigo-500/20 bg-slate-900/50 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4" />
            <p className="text-indigo-400 font-medium animate-pulse">Running Profile Analysis...</p>
            <p className="text-sm text-slate-500 mt-2">Generating statistics and inferring data types</p>
          </div>
        ) : isProfileError || !profile ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-400">
            <p>Failed to generate dataset profile. The session may have expired or the dataset is corrupted.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <section>
              <DatasetSummaryCard summary={profile.summary} />
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">Column Explorer</h3>
              <ColumnExplorer 
                columns={columns || []} 
                onSelectColumn={(name) => setSelectedColumn(name)} 
              />
            </section>

          </div>
        )}
      </main>

      {/* Column Details Drawer */}
      <ColumnDetailsDrawer 
        sessionId={sessionId}
        columnName={selectedColumn}
        onClose={() => setSelectedColumn(null)}
      />

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 flex justify-center overflow-hidden">
        <div className="absolute top-0 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>
    </div>
  );
}
