"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrainCircuit, Search, Bell, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

export default function Navbar({ datasetName }: { datasetName?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ datasets: any[], reports: any[] }>({ datasets: [], reports: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const [notifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Debounced Search
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        setSearchError(false);
        try {
          const res = await api.get(`/api/v1/admin/search?q=${searchQuery}`);
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        } catch (error) {
          console.error("Search failed", error);
          setSearchError(true);
          setSearchResults({ datasets: [], reports: [] });
          setShowSearchDropdown(true);
        } finally {
          setIsSearching(false);
        }
      } else {
        setShowSearchDropdown(false);
        setSearchResults({ datasets: [], reports: [] });
        setSearchError(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 gap-4 relative">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            InsightFlow
          </span>
        </Link>

        {datasetName && (
          <div className="flex items-center text-sm text-slate-500 gap-1.5 hidden md:flex">
            <span className="text-slate-700">/</span>
            <span className="text-slate-300 font-medium truncate max-w-[200px]">{datasetName}</span>
          </div>
        )}

        <div className="flex-1 max-w-md ml-auto relative">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
            <input
              type="text"
              aria-label="Search datasets, versions"
              placeholder="Search datasets, versions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true); }}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500/60 rounded-full py-2 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
            />
            {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />}
          </div>
          
          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50">
              <div className="p-2 space-y-1">
                {isSearching ? (
                  <div className="p-4 text-sm text-slate-400 text-center flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                    <span>Searching workspace...</span>
                  </div>
                ) : searchError ? (
                  <div className="p-4 text-sm text-rose-300 text-center flex flex-col items-center gap-1">
                    <Search className="h-5 w-5 text-rose-400/70 mb-1" />
                    <span>Search is temporarily unavailable</span>
                    <span className="text-xs text-slate-500">Try again in a moment.</span>
                  </div>
                ) : searchResults.datasets.length === 0 && searchResults.reports.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400 text-center flex flex-col items-center gap-1">
                    <Search className="h-5 w-5 text-slate-600 mb-1" />
                    <span>No datasets or reports found</span>
                    <span className="text-xs text-slate-500">Search by filename, dataset, or report title.</span>
                  </div>
                ) : (
                  <>
                    {searchResults.datasets.map((item, idx) => (
                    <Link
                      key={`dataset-${idx}`}
                      href={item.type === "dataset" ? `/datasets/${item.id}` : "#"}
                      className="flex flex-col p-2.5 hover:bg-slate-800/80 rounded-lg transition-colors"
                    >
                      <span className="text-sm text-white font-medium">{item.name}</span>
                      <span className="text-xs text-slate-400 capitalize">{item.type}</span>
                    </Link>
                    ))}
                    {searchResults.reports.map((item, idx) => (
                      <Link
                        key={`report-${idx}`}
                        href={item.session_id ? `/datasets/${item.session_id}` : "#"}
                        className="flex flex-col p-2.5 hover:bg-slate-800/80 rounded-lg transition-colors"
                      >
                        <span className="text-sm text-white font-medium">{item.title || item.name || "Shared report"}</span>
                        <span className="text-xs text-slate-400 capitalize">{item.type || "report"}</span>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Notifications</h4>
                <span className="text-xs text-slate-500">0 unread</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-3">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-8 w-8 text-indigo-400/60" />
                    <p className="font-medium text-slate-300">You're all caught up</p>
                    <p className="text-xs text-slate-500">No new notifications at this time.</p>
                  </div>
                ) : (
                  notifications.map((n, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-800/60 rounded-lg mb-1 cursor-pointer transition-colors">
                      <p className="text-sm text-white font-medium">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <Link 
            href="/datasets" 
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 hover:text-white transition-all flex items-center gap-1.5"
          >
             <ArrowLeft className="h-3.5 w-3.5" /> Upload
          </Link>
          
          <Link 
            href="/admin" 
            className="hidden sm:inline-flex text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-900/80 hover:text-slate-300 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
