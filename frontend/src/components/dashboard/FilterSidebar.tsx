"use client";

import { useState } from "react";
import { Plus, X, Filter } from "lucide-react";
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
    <div className="w-64 flex-shrink-0 flex flex-col gap-4 p-4 border border-slate-800 bg-slate-900/50 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-medium text-white">Global Filters</h3>
      </div>
      
      <div className="space-y-3 bg-slate-800/30 p-3 rounded-lg border border-slate-800">
        <Select value={col} onValueChange={(val) => setCol(val || "")}>
          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm h-8">
            <SelectValue placeholder="Column" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={op} onValueChange={(val) => setOp(val || "")}>
          <SelectTrigger className="bg-slate-900 border-slate-700 text-sm h-8">
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="gt">Greater Than</SelectItem>
            <SelectItem value="lt">Less Than</SelectItem>
          </SelectContent>
        </Select>

        <Input 
          placeholder="Value" 
          value={val} 
          onChange={(e) => setVal(e.target.value)}
          className="h-8 bg-slate-900 border-slate-700 text-sm"
        />

        <Button onClick={handleAdd} className="w-full h-8 bg-indigo-600 hover:bg-indigo-500 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add Filter
        </Button>
      </div>

      <div className="space-y-2 mt-2">
        {filters.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No active filters</p>
        ) : (
          filters.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded text-xs text-slate-300 border border-slate-700/50">
              <span className="truncate pr-2">
                <span className="font-semibold text-indigo-300">{f.column}</span> {f.operator} <span className="text-slate-100">'{f.value}'</span>
              </span>
              <button onClick={() => handleRemove(i)} className="text-slate-500 hover:text-rose-400">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {filters.length > 0 && (
        <Button variant="ghost" onClick={() => onFiltersChange([])} className="w-full text-xs text-slate-400 hover:text-white">
          Clear All
        </Button>
      )}
    </div>
  );
}
