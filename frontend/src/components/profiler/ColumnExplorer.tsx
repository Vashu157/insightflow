"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Search } from "lucide-react";

export default function ColumnExplorer({ columns, onSelectColumn }: { columns: any[], onSelectColumn: (name: string) => void }) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'numeric': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'categorical': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'date': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'boolean': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 backdrop-blur-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search columns..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 border-0 bg-transparent text-slate-200 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/50">
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center text-slate-300">Name <ArrowUpDown className="ml-2 h-3 w-3" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('inferred_type')}>
                <div className="flex items-center text-slate-300">Type <ArrowUpDown className="ml-2 h-3 w-3" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('missing_percentage')}>
                <div className="flex items-center text-slate-300">Missing <ArrowUpDown className="ml-2 h-3 w-3" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('unique_count')}>
                <div className="flex items-center text-slate-300">Unique <ArrowUpDown className="ml-2 h-3 w-3" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColumns.map((col, idx) => (
              <TableRow 
                key={idx} 
                onClick={() => onSelectColumn(col.name)}
                className="cursor-pointer border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                <TableCell className="font-medium text-slate-200">{col.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getTypeColor(col.inferred_type)}>
                    {col.inferred_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${col.missing_percentage}%` }} />
                    </div>
                    {col.missing_percentage}% ({col.missing_count})
                  </div>
                </TableCell>
                <TableCell className="text-slate-400">{col.unique_count.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {filteredColumns.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No columns found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
