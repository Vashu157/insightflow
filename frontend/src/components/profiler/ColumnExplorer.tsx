"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Search, ChevronRight } from "lucide-react";

export default function ColumnExplorer({ columns, onSelectColumn }: { columns: any[], onSelectColumn: (name: string) => void }) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const getTypeColor = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'numeric': 
      case 'integer':
      case 'float': return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'categorical': 
      case 'string': return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'datetime':
      case 'date': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'boolean': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedColumns = [...columns].sort((a, b) => {
    if (!sortConfig) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredColumns = sortedColumns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 backdrop-blur-md max-w-md shadow-inner">
        <Search className="h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search columns by name..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 border-0 bg-transparent text-slate-200 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs font-medium"
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-md overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-slate-900/90 border-b border-slate-800">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="cursor-pointer py-3.5 px-4" onClick={() => handleSort('name')}>
                <div className="flex items-center text-xs font-semibold text-slate-300">Name <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-500" /></div>
              </TableHead>
              <TableHead className="cursor-pointer py-3.5 px-4" onClick={() => handleSort('inferred_type')}>
                <div className="flex items-center text-xs font-semibold text-slate-300">Type <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-500" /></div>
              </TableHead>
              <TableHead className="cursor-pointer py-3.5 px-4" onClick={() => handleSort('missing_percentage')}>
                <div className="flex items-center text-xs font-semibold text-slate-300">Missing Ratio <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-500" /></div>
              </TableHead>
              <TableHead className="cursor-pointer py-3.5 px-4" onClick={() => handleSort('unique_count')}>
                <div className="flex items-center text-xs font-semibold text-slate-300">Unique Values <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-500" /></div>
              </TableHead>
              <TableHead className="py-3.5 px-4 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColumns.map((col, idx) => (
              <TableRow 
                key={idx} 
                onClick={() => onSelectColumn(col.name)}
                className="group cursor-pointer border-slate-800/50 even:bg-slate-900/30 odd:bg-slate-950/40 hover:bg-slate-800/60 transition-colors"
              >
                <TableCell className="font-semibold text-slate-200 text-xs font-mono py-3 px-4">{col.name}</TableCell>
                <TableCell className="py-3 px-4">
                  <Badge variant="outline" className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${getTypeColor(col.inferred_type)}`}>
                    {col.inferred_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 text-xs py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: `${Math.min(100, col.missing_percentage)}%` }} />
                    </div>
                    <span className="font-mono text-slate-400">{col.missing_percentage}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-300 text-xs font-mono py-3 px-4">{col.unique_count.toLocaleString()}</TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </TableCell>
              </TableRow>
            ))}
            {filteredColumns.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-slate-500 text-xs">
                  No columns matching "{search}".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

