"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrainCircuit, Search, Bell, ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";

export default function Navbar({ datasetName }: { datasetName?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ datasets: any[], reports: any[] }>({ datasets: [], reports: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Debounced Search
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await axios.get(`http://localhost:8000/api/v1/admin/search?q=${searchQuery}`);
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setShowSearchDropdown(false);
        setSearchResults({ datasets: [], reports: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-6 gap-4 relative">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white hidden sm:block">InsightFlow</span>
        </Link>

        {datasetName && (
          <div className="flex items-center text-sm text-slate-500 gap-1 hidden md:flex">
            <span>/</span>
            <span className="text-slate-300 truncate max-w-[200px]">{datasetName}</span>
          </div>
        )}

        <div className="flex-1 max-w-md ml-auto relative">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search datasets, versions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true); }}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className="w-full bg-slate-900 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
          </div>
          
          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
              <div className="p-2">
                {searchResults.datasets.length === 0 ? (
                  <div className="p-3 text-sm text-slate-400 text-center">No results found.</div>
                ) : (
                  searchResults.datasets.map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.type === "dataset" ? `/datasets/${item.id}` : "#"}
                      className="flex flex-col p-3 hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <span className="text-sm text-white font-medium">{item.name}</span>
                      <span className="text-xs text-slate-400 capitalize">{item.type}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-full right-10 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-800">
                <h4 className="text-sm font-semibold text-white">Notifications</h4>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((n, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-800 rounded-md mb-1 cursor-pointer">
                      <p className="text-sm text-white font-medium">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <Link href="/datasets" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1">
             <ArrowLeft className="h-4 w-4" /> New
          </Link>
          
          <Link href="/admin" className="text-sm font-medium px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
