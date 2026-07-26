"use client";

import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import UploadCard from "@/components/datasets/UploadCard";
import { useRouter } from "next/navigation";

export default function DatasetsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">InsightFlow</span>
          </Link>
          <div className="ml-auto flex gap-4 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/datasets" className="text-indigo-400">Upload</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16 max-w-4xl flex flex-col items-center justify-center">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
            Upload Your Dataset
          </h1>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
            Start a new analysis session by uploading a CSV or Excel file. The AI engine will automatically profile your data and prepare interactive dashboards.
          </p>
        </div>

        <div className="w-full max-w-xl">
          <UploadCard onUploadSuccess={(id) => router.push(`/datasets/${id}`)} />
        </div>
      </main>

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 flex justify-center overflow-hidden">
        <div className="absolute top-0 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>
    </div>
  );
}
