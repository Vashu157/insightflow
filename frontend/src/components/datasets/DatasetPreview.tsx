"use client";

import { useState } from "react";
import { useDatasetPreview } from "@/hooks/useSessions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DatasetPreview({ sessionId }: { sessionId: string }) {
  const [page, setPage] = useState(0);
  const limit = 20;
  const offset = page * limit;

  const { data: preview, isLoading, isError } = useDatasetPreview(sessionId, limit, offset);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading dataset preview...</p>
        </div>
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-red-900/30 bg-red-950/20 text-red-400">
        <p>Failed to load dataset preview.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(preview.total_rows / limit);

  return (
    <div className="flex flex-col space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-800/50">
              <TableRow className="border-slate-700 hover:bg-transparent">
                {preview.columns.map((col, idx) => (
                  <TableHead key={idx} className="whitespace-nowrap text-slate-300">
                    <div className="flex flex-col">
                      <span className="font-semibold">{col}</span>
                      <span className="text-xs text-indigo-400">{preview.data_types[col]}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.data.map((row, rowIdx) => (
                <TableRow key={rowIdx} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  {preview.columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className="whitespace-nowrap text-slate-400 max-w-[200px] truncate">
                      {row[col] !== null ? String(row[col]) : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {preview.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={preview.columns.length} className="h-24 text-center text-slate-500">
                    No data available in this range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {offset + 1} to {Math.min(offset + limit, preview.total_rows)} of {preview.total_rows.toLocaleString()} entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <span className="text-sm font-medium text-slate-400 px-2">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
