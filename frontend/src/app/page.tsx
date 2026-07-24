import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LayoutDashboard, BrainCircuit, FileBarChart2 } from "lucide-react";

export default function Home() {
  const cards = [
    {
      title: "Dataset Upload",
      description: "Securely upload and manage your product datasets.",
      icon: Database,
      color: "from-blue-500/20 to-blue-500/5",
      border: "border-blue-500/20",
    },
    {
      title: "Analytics Dashboard",
      description: "Visualize KPIs and track core product metrics in real-time.",
      icon: LayoutDashboard,
      color: "from-purple-500/20 to-purple-500/5",
      border: "border-purple-500/20",
    },
    {
      title: "AI Insights",
      description: "Generate intelligent business insights automatically.",
      icon: BrainCircuit,
      color: "from-emerald-500/20 to-emerald-500/5",
      border: "border-emerald-500/20",
    },
    {
      title: "Reports",
      description: "Export beautiful, presentation-ready business reports.",
      icon: FileBarChart2,
      color: "from-orange-500/20 to-orange-500/5",
      border: "border-orange-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">
              InsightFlow
            </span>
          </div>
          <div className="ml-auto flex gap-4 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Dashboard</a>
            <a href="#" className="hover:text-white transition-colors">Datasets</a>
            <a href="#" className="hover:text-white transition-colors">Settings</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-20">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-300 mb-6 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            Phase 1 Overview
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 sm:text-6xl mb-6">
            Welcome to InsightFlow
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Your production-quality AI Product Analytics platform. Uncover hidden patterns, track metrics effortlessly, and let AI guide your business decisions.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => (
            <Card 
              key={index} 
              className={`group relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardHeader className="relative">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${card.border} bg-slate-800/50 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="h-6 w-6 text-slate-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-100 group-hover:text-white transition-colors">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-slate-400 group-hover:text-slate-300 transition-colors">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center text-sm font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  Explore module &rarr;
                </div>
              </CardContent>
            </Card>
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
