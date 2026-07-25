"use client";

import { useState } from "react";
import { useTableData } from "@/hooks/useAnalytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

export default function DataTable({ sessionId, globalFilters }: { sessionId: string, globalFilters: any[] }) {
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const limit = 50;

  const { data, isLoading } = useTableData(sessionId, {
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
    return <div className="h-64 flex items-center justify-center text-slate-500">Loading table data...</div>;
  }

  if (!data || !data.data) {
    return <div className="h-64 flex items-center justify-center text-rose-400">Failed to load table</div>;
  }

  const totalPages = Math.ceil(data.filtered_rows / limit);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-400">
          Showing {data.filtered_rows.toLocaleString()} of {data.total_rows.toLocaleString()} total rows
          {globalFilters.length > 0 && " (Filtered)"}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="bg-slate-900 border-slate-700 text-slate-300">
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <span className="text-sm text-slate-400 px-2">Page {page + 1} of {Math.max(1, totalPages)}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="bg-slate-900 border-slate-700 text-slate-300">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-auto h-[600px]">
          <Table>
            <TableHeader className="bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="border-slate-700 hover:bg-transparent">
                {data.columns.map((col: string, idx: number) => (
                  <TableHead key={idx} className="whitespace-nowrap text-slate-300 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort(col)}>
                    <div className="flex items-center gap-1">
                      {col}
                      {sortCol === col && <ArrowUpDown className="h-3 w-3 text-indigo-400" />}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row: any, rowIdx: number) => (
                <TableRow key={rowIdx} className="border-slate-800 hover:bg-slate-800/30">
                  {data.columns.map((col: string, colIdx: number) => (
                    <TableCell key={colIdx} className="whitespace-nowrap text-slate-400 max-w-[200px] truncate">
                      {row[col] !== null ? String(row[col]) : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={data.columns.length} className="h-32 text-center text-slate-500">
                    No matching records found.
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
