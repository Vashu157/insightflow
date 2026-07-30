import Link from "next/link";
import { BrainCircuit, ArrowRight, Database, LayoutDashboard, BrainCircuit as BrainIcon, FileBarChart2, Sparkles, TrendingUp, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Dataset Upload",
    description: "Securely upload and manage your product datasets. CSV and Excel supported.",
    icon: Database,
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    title: "Analytics Dashboard",
    description: "Build custom visualizations and track core product metrics interactively.",
    icon: LayoutDashboard,
    color: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    title: "AI Insights",
    description: "Let Gemini AI automatically generate business insights and anomaly reports.",
    icon: BrainIcon,
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    title: "Export & Share",
    description: "Download your data as CSV or Excel, and share read-only reports with stakeholders.",
    icon: FileBarChart2,
    color: "from-orange-500/20 to-orange-500/5",
    border: "border-orange-500/20",
    iconColor: "text-orange-400",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
              InsightFlow
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/datasets" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Datasets
            </Link>
            <Link href="/datasets">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/25">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="container mx-auto px-4 sm:px-6 pt-16 pb-24 space-y-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI-Powered Product Analytics Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 leading-[1.1]">
            Turn Raw Data Into Executive Decisions
          </h1>
          
          <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
            Upload any CSV or Excel dataset. Get instant profiling, interactive dashboards, and AI-generated executive business reports — in seconds.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/datasets">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition-transform">
                Upload Your Dataset <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Instant AI Profiling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>No Auth Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>CSV & Excel Support</span>
            </div>
          </div>
        </div>

        {/* Product Preview Mockup */}
        <div className="max-w-5xl mx-auto relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-indigo-500/30 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl space-y-4 overflow-hidden">
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-medium text-slate-400 font-mono">Q3_Customer_Retention.csv</span>
              </div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                Live Preview
              </span>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Total Revenue</span>
                <div className="text-xl font-bold text-white flex items-center justify-between">
                  $1,248,500
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-[10px] text-emerald-400">+14.2% from last quarter</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Active Users</span>
                <div className="text-xl font-bold text-white flex items-center justify-between">
                  84,210
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="text-[10px] text-indigo-400">98.4% data completeness</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">AI Insights</span>
                <div className="text-xl font-bold text-white flex items-center justify-between">
                  4 Key Insights
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-[10px] text-amber-400">Generated via Gemini AI</span>
              </div>
            </div>

            {/* Mock Chart Area */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 h-32 flex items-end justify-between gap-2 px-6">
              {[40, 65, 50, 85, 70, 95, 80, 110, 90, 120].map((h, i) => (
                <div key={i} className="w-full bg-gradient-to-t from-indigo-600/40 to-indigo-400 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="max-w-5xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Link key={index} href="/datasets" className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 p-6 block">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
              <div className="relative">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${feature.border} bg-slate-800/50 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex items-center text-sm font-medium text-indigo-400 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  Start now <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 flex justify-center overflow-hidden">
        <div className="absolute top-0 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-[30rem] w-[30rem] -translate-y-1/2 translate-x-1/3 rounded-full bg-purple-500/10 blur-[100px]" />
      </div>
    </div>
  );
}

