"use client";

import { useState } from "react";
import { Plus, X, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FilterSidebar({ 
  columns, 
  filters, 
  onFiltersChange 
}: { 
  columns: string[], 
  filters: any[], 
  onFiltersChange: (filters: any[]) => void 
}) {
  const [col, setCol] = useState("");
  const [op, setOp] = useState("equals");
  const [val, setVal] = useState("");

  const handleAdd = () => {
    if (!col || !val) return;
    onFiltersChange([...filters, { column: col, operator: op, value: val }]);
    setCol("");
    setVal("");
  };

  const handleRemove = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    onFiltersChange(newFilters);
  };

  return (
    <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4 p-5 border border-slate-800/80 bg-slate-900/40 backdrop-blur-md rounded-2xl shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Filter className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-white">Global Filters</h3>
        </div>
        {filters.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
            {filters.length} active
          </span>
        )}
      </div>

      {/* Applied Filter Chips */}
      {filters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium uppercase tracking-wider text-[10px]">Applied Filters</span>
            <button 
              onClick={() => onFiltersChange([])} 
              className="text-[11px] text-rose-400/80 hover:text-rose-300 flex items-center gap-1 transition-colors focus-ring rounded-md px-1"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f, i) => (
              <div 
                key={i} 
                className="group inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs transition-colors"
              >
                <span className="font-medium text-indigo-200">{f.column}</span>
                <span className="text-[10px] text-indigo-400 font-mono">{f.operator}</span>
                <span className="font-semibold text-white">"{f.value}"</span>
                <button 
                  onClick={() => handleRemove(i)} 
                  aria-label={`Remove filter ${f.column}`}
                  className="text-indigo-400 hover:text-rose-400 transition-colors ml-0.5 focus-ring rounded-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Filter Add Form */}
      <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
          Add New Filter
        </span>
        <Select value={col} onValueChange={(val) => setCol(val || "")}>
          <SelectTrigger className="bg-slate-900 border-slate-700 text-xs h-9 rounded-lg">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={op} onValueChange={(val) => setOp(val || "")}>
          <SelectTrigger className="bg-slate-900 border-slate-700 text-xs h-9 rounded-lg">
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
            <SelectItem value="lt">Less Than (&lt;)</SelectItem>
          </SelectContent>
        </Select>

        <Input 
          placeholder="Filter value..." 
          value={val} 
          onChange={(e) => setVal(e.target.value)}
          className="h-9 bg-slate-900 border-slate-700 text-xs rounded-lg"
        />

        <Button onClick={handleAdd} disabled={!col || !val} className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Filter
        </Button>
      </div>
    </div>
  );
}

