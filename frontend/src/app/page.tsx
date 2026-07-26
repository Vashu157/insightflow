import Link from "next/link";
import { BrainCircuit, ArrowRight, Database, LayoutDashboard, BrainCircuit as BrainIcon, FileBarChart2 } from "lucide-react";
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
          <div className="ml-auto flex items-center gap-6">
            <Link href="/datasets" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Datasets
            </Link>
            <Link href="/datasets">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="container mx-auto px-6 py-24">
        <div className="mb-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-300 mb-6 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 mr-2 animate-pulse" />
            AI-Powered Analytics Platform
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 sm:text-6xl mb-6 max-w-3xl">
            Turn Data Into Business Decisions
          </h1>
          <p className="max-w-2xl text-lg text-slate-400 mb-10">
            Upload any CSV or Excel dataset. Get instant profiling, interactive dashboards, and AI-generated executive reports — in seconds.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/datasets">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8">
                Upload Your Dataset <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
