"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check, Clock, Database } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import api from "@/lib/api";

export default function ChatResults({ message, sessionId }: { message: any, sessionId: string }) {
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    if (!message.sql_query) return;
    const baseUrl = api.defaults.baseURL;
    // Use fetch to POST the SQL query and receive a file download
    try {
      const res = await fetch(`${baseUrl}/sessions/${sessionId}/export/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql_query: message.sql_query, format: 'csv' }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'query_results.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail; the button is a convenience feature.
    }
  };

  if (!message || message.role !== 'ai') return null;

  const handleCopy = () => {
    if (message.sql_query) {
      navigator.clipboard.writeText(message.sql_query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasData = message.results && message.results.data && message.results.data.length > 0;

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-4 scrollbar-thin">
      
      {/* AI Explanation / Main Response */}
      <div className="prose prose-invert max-w-none text-slate-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>

      {/* SQL Query Section */}
      {message.sql_query && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
          <div 
            className="flex items-center justify-between p-3 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => setShowSql(!showSql)}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              {showSql ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Generated SQL
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {message.execution_time_ms && (
                <span className="flex items-center gap-1" title="Execution Time">
                  <Clock className="h-3 w-3" /> {message.execution_time_ms}ms
                </span>
              )}
              {message.row_count !== undefined && (
                <span className="flex items-center gap-1" title="Rows Processed">
                  <Database className="h-3 w-3" /> {message.row_count} rows
                </span>
              )}
            </div>
          </div>
          
          {showSql && (
            <div className="relative border-t border-slate-800">
              <pre className="p-4 text-sm text-indigo-300 overflow-x-auto">
                <code>{message.sql_query}</code>
              </pre>
              <button 
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Copy SQL"
                aria-label="Copy generated SQL"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Data Table Section */}
      {hasData && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 flex-1 flex flex-col min-h-[300px] overflow-hidden shadow-sm">
          <div className="flex justify-between items-center p-3 border-b border-slate-800">
            <h4 className="text-sm font-medium text-slate-300">Query Results</h4>
            <Button variant="outline" size="sm" onClick={handleExport} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader className="bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="border-slate-700 hover:bg-transparent">
                  {message.results.columns.map((col: string, idx: number) => (
                    <TableHead key={idx} className="whitespace-nowrap text-slate-300 font-semibold text-xs uppercase tracking-wider">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {message.results.data.map((row: any, rowIdx: number) => (
                  <TableRow key={rowIdx} className="border-slate-800 even:bg-slate-950/30 hover:bg-slate-800/40 transition-colors">
                    {message.results.columns.map((col: string, colIdx: number) => (
                      <TableCell key={colIdx} className="whitespace-nowrap text-slate-400 max-w-[200px] truncate text-sm">
                        {row[col] !== null ? String(row[col]) : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
