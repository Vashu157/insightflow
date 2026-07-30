"use client";

import { useState } from "react";
import { useTableData } from "@/hooks/useAnalytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, Download, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function DataTable({ sessionId, globalFilters }: { sessionId: string, globalFilters: any[] }) {
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const limit = 50;

  const handleExport = (format: 'csv' | 'excel') => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = new URL(`${baseUrl}/sessions/${sessionId}/export/data`);
    url.searchParams.append('format', format);
    window.open(url.toString(), '_blank');
  };

  const { data, isLoading, isError } = useTableData(sessionId, {
    filters: globalFilters,
    limit,
    offset: page * limit,
    sort_column: sortCol,
    sort_desc: sortDesc
  });

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading dataset records...</span>
      </div>
    );
  }

  if (isError || !data || !data.data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-rose-400 text-sm gap-2">
        <span>Failed to load dataset table.</span>
        <span className="text-xs text-slate-500">Check server connection and try again.</span>
      </div>
    );
  }

  const totalPages = Math.ceil(data.filtered_rows / limit);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="text-xs sm:text-sm text-slate-400">
          Showing <span className="text-slate-100 font-semibold">{data.filtered_rows.toLocaleString()}</span> of{" "}
          <span className="text-slate-100 font-semibold">{data.total_rows.toLocaleString()}</span> rows
          {globalFilters.length > 0 && <span className="ml-2 text-indigo-400 font-medium">(filtered)</span>}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-xl">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="focus:bg-slate-800 cursor-pointer text-xs">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="focus:bg-slate-800 cursor-pointer text-xs">
                Export as Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="bg-slate-900 border-slate-700 text-slate-300">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-slate-400 font-mono px-1">
            {page + 1} / {Math.max(1, totalPages)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="bg-slate-900 border-slate-700 text-slate-300">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-inner">
        <div className="overflow-auto max-h-[550px] scrollbar-thin scrollbar-thumb-slate-800">
          <Table>
            <TableHeader className="bg-slate-900/90 sticky top-0 z-10 backdrop-blur-md border-b border-slate-800">
              <TableRow className="border-slate-800 hover:bg-transparent">
                {data.columns.map((col: string, idx: number) => (
                  <TableHead
                    key={idx}
                    className="whitespace-nowrap text-slate-300 text-xs font-semibold py-3 px-4 cursor-pointer hover:bg-slate-800/60 select-none transition-colors"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      {sortCol === col
                        ? <ArrowUpDown className="h-3 w-3 text-indigo-400" />
                        : <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-40 group-hover:opacity-100" />
                      }
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: any, rowIdx: number) => (
                <TableRow key={rowIdx} className="border-slate-800/50 even:bg-slate-900/30 odd:bg-slate-950/40 hover:bg-slate-800/50 transition-colors">
                  {data.columns.map((col: string, colIdx: number) => {
                    const cellVal = row[col] !== null && row[col] !== undefined ? String(row[col]) : "";
                    return (
                      <TableCell 
                        key={colIdx} 
                        title={cellVal}
                        className="whitespace-nowrap text-slate-300 max-w-[220px] truncate text-xs font-mono py-2.5 px-4"
                      >
                        {cellVal || <span className="text-slate-600 italic">null</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={data.columns.length} className="h-32 text-center text-slate-500 text-sm">
                    No records match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

