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
      <div className="h-64 flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        <span className="text-sm">Loading table data...</span>
      </div>
    );
  }

  if (isError || !data || !data.data) {
    return (
      <div className="h-64 flex items-center justify-center text-rose-400 text-sm">
        Failed to load table data. Please refresh and try again.
      </div>
    );
  }

  const totalPages = Math.ceil(data.filtered_rows / limit);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="text-sm text-slate-400">
          Showing <span className="text-slate-200 font-medium">{data.filtered_rows.toLocaleString()}</span> of{" "}
          <span className="text-slate-200 font-medium">{data.total_rows.toLocaleString()}</span> rows
          {globalFilters.length > 0 && <span className="ml-2 text-indigo-400 text-xs">(filtered)</span>}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border h-8 px-3 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800">
              <Download className="h-4 w-4 mr-2" /> Export
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-200">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="focus:bg-slate-700 cursor-pointer">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="focus:bg-slate-700 cursor-pointer">
                Export as Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="bg-slate-900 border-slate-700 text-slate-300">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-400 px-1">
            {page + 1} / {Math.max(1, totalPages)}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="bg-slate-900 border-slate-700 text-slate-300">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-auto h-[600px]">
          <Table>
            <TableHeader className="bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="border-slate-700 hover:bg-transparent">
                {data.columns.map((col: string, idx: number) => (
                  <TableHead
                    key={idx}
                    className="whitespace-nowrap text-slate-300 cursor-pointer hover:bg-slate-700/50 select-none"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      {col}
                      {sortCol === col
                        ? <ArrowUpDown className="h-3 w-3 text-indigo-400" />
                        : <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100" />
                      }
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: any, rowIdx: number) => (
                <TableRow key={rowIdx} className="border-slate-800 hover:bg-slate-800/30">
                  {data.columns.map((col: string, colIdx: number) => (
                    <TableCell key={colIdx} className="whitespace-nowrap text-slate-400 max-w-[200px] truncate text-sm">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={data.columns.length} className="h-32 text-center text-slate-500">
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
