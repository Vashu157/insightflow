"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ChartBuilderDialog({ 
  columns, 
  numericColumns, 
  categoricalColumns, 
  onSave 
}: { 
  columns: string[],
  numericColumns: string[],
  categoricalColumns: string[],
  onSave: (chart: any) => void 
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [chartType, setChartType] = useState("Bar");
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [agg, setAgg] = useState("count");

  const handleSave = () => {
    if (!title || !chartType || !xCol) return;
    
    // Basic Validation
    if (chartType === "Histogram" && !numericColumns.includes(xCol)) return;
    if (["Bar", "Line", "Area", "Scatter"].includes(chartType) && agg !== "count" && !yCol) return;

    onSave({
      id: Math.random().toString(36).substring(7),
      title,
      chart_type: chartType,
      x_column: xCol,
      y_column: yCol || null,
      aggregation: agg,
      filters: [],
      x: 0, y: 9999, w: 4, h: 3 // Grid layout defaults
    });

    setOpen(false);
    // Reset
    setTitle("");
    setChartType("Bar");
    setXCol("");
    setYCol("");
    setAgg("count");
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Chart
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-950 text-slate-200 border-slate-800">
        <DialogHeader>
          <DialogTitle>Create Visualization</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Chart Title</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Sales by Region" 
              className="bg-slate-900 border-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Chart Type</label>
              <Select value={chartType} onValueChange={(val) => setChartType(val || "")}>
                <SelectTrigger className="bg-slate-900 border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="Bar">Bar Chart</SelectItem>
                  <SelectItem value="Line">Line Chart</SelectItem>
                  <SelectItem value="Pie">Pie Chart</SelectItem>
                  <SelectItem value="Histogram">Histogram</SelectItem>
                  <SelectItem value="Scatter">Scatter Plot</SelectItem>
                  <SelectItem value="Area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Aggregation</label>
              <Select value={agg} onValueChange={(val) => setAgg(val || "")} disabled={chartType === 'Histogram' || chartType === 'Scatter'}>
                <SelectTrigger className="bg-slate-900 border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">X-Axis (Group By)</label>
            <Select value={xCol} onValueChange={(val) => setXCol(val || "")}>
              <SelectTrigger className="bg-slate-900 border-slate-800">
                <SelectValue placeholder="Select Column" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                {(chartType === 'Histogram' ? numericColumns : columns).map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {agg !== 'count' && chartType !== 'Histogram' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Y-Axis (Numeric value)</label>
              <Select value={yCol} onValueChange={(val) => setYCol(val || "")}>
                <SelectTrigger className="bg-slate-900 border-slate-800">
                  <SelectValue placeholder="Select Numeric Column" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  {numericColumns.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500">Create Chart</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
