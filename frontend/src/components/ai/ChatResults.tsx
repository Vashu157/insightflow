"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check, Clock, Database } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatResults({ message }: { message: any }) {
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

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
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
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
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Data Table Section */}
      {hasData && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden flex-1">
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
                  <TableRow key={rowIdx} className="border-slate-800 hover:bg-slate-800/30">
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
