"use client";

import { useRef, useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Download, Trash2, GripVertical, BarChart3, Loader2 } from "lucide-react";
import { useChartData } from "@/hooks/useAnalytics";
import html2canvas from "html2canvas";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4'];

interface ChartConfig {
  id: string;
  title: string;
  chart_type: string;
  x_column: string;
  y_column?: string;
  aggregation?: string;
  filters?: any[];
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ChartRenderer = ({ sessionId, config, globalFilters }: { sessionId: string; config: ChartConfig; globalFilters: any[] }) => {
  const mergedConfig = { ...config, filters: [...(config.filters || []), ...globalFilters] };
  const { data, isLoading } = useChartData(sessionId, mergedConfig);
  const chartRef = useRef<HTMLDivElement>(null);

  const downloadImage = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#0f172a' });
    const link = document.createElement("a");
    link.download = `${config.title || 'chart'}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 gap-2 bg-slate-900/60 rounded-2xl border border-slate-800">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        <span className="text-xs">Loading chart data...</span>
      </div>
    );
  }

  if (!data || data.data?.length === 0 || data.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-500 gap-1.5 bg-slate-900/60 rounded-2xl border border-slate-800 p-4">
        <BarChart3 className="h-6 w-6 text-slate-600 mb-1" />
        <span className="text-xs font-medium text-slate-400">No data available</span>
        <span className="text-[11px] text-slate-600 text-center">Try relaxing your filter criteria</span>
      </div>
    );
  }

  const chartData: any[] = Array.isArray(data) ? data : (data.data || []);

  const renderChart = () => {
    const isCount = (config.aggregation || 'count') === 'count';
    const yKey = isCount ? 'count' : (config.y_column || 'value');
    const xKey = config.chart_type === 'Histogram' ? 'range' : config.x_column;

    switch (config.chart_type) {
      case 'Bar':
      case 'Histogram':
        return (
          <BarChart data={chartData}>
            <XAxis dataKey={xKey} stroke="#64748b" fontSize={11} tickFormatter={(val: string) => typeof val === 'string' && val.length > 10 ? val.substring(0, 10) + '...' : val} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
            <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'Line':
        return (
          <LineChart data={chartData}>
            <XAxis dataKey={xKey} stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
            <Line type="monotone" dataKey={yKey} stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3.5, fill: '#ec4899' }} />
          </LineChart>
        );
      case 'Area':
        return (
          <AreaChart data={chartData}>
            <XAxis dataKey={xKey} stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
            <Area type="monotone" dataKey={yKey} stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
          </AreaChart>
        );
      case 'Pie':
        return (
          <PieChart>
            <Pie data={chartData} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius="75%" label>
              {chartData.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        );
      case 'Scatter':
        return (
          <ScatterChart>
            <XAxis type="number" dataKey={config.x_column} name={config.x_column} stroke="#64748b" fontSize={11} />
            <YAxis type="number" dataKey={config.y_column} name={config.y_column} stroke="#64748b" fontSize={11} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
            <Scatter data={chartData} fill="#f97316" />
          </ScatterChart>
        );
      default:
        return <div className="flex h-full items-center justify-center text-rose-400 text-xs">Unsupported chart type</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md" ref={chartRef}>
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/60 cursor-move chart-drag-handle group/header">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-slate-600 group-hover/header:text-slate-400 transition-colors" />
          <h4 className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{config.title}</h4>
        </div>
        <button 
          onMouseDown={(e) => e.stopPropagation()} 
          onClick={downloadImage} 
          className="text-slate-500 hover:text-indigo-400 p-1 transition-colors" 
          title="Export PNG"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 p-3 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ReactGridLayout = GridLayout as any;

export default function DashboardGrid({
  sessionId,
  charts,
  onChartsChange,
  globalFilters
}: {
  sessionId: string;
  charts: ChartConfig[];
  onChartsChange: (charts: ChartConfig[]) => void;
  globalFilters: any[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLayoutChange = (layout: any) => {
    const layoutArray: LayoutItem[] = Array.isArray(layout) ? layout : [];
    const updatedCharts = charts.map(chart => {
      const l = layoutArray.find((item: LayoutItem) => item.i === chart.id);
      if (l) return { ...chart, x: l.x, y: l.y, w: l.w, h: l.h };
      return chart;
    });
    if (JSON.stringify(charts) !== JSON.stringify(updatedCharts)) {
      onChartsChange(updatedCharts);
    }
  };

  const removeChart = (id: string) => {
    onChartsChange(charts.filter(c => c.id !== id));
  };

  if (!charts || charts.length === 0) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-800/80 bg-slate-950/20 rounded-2xl text-center p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
          <BarChart3 className="h-8 w-8 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">No charts added yet</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Click an AI-recommended chart above or use <span className="text-indigo-400 font-medium">Build Custom Chart</span> to create your first visualization.
          </p>
        </div>
      </div>
    );
  }

  const layout: LayoutItem[] = charts.map(c => ({ i: c.id, x: c.x, y: c.y, w: c.w, h: c.h, minW: 3, minH: 2 } as LayoutItem));

  return (
    <div ref={containerRef} className="w-full">
      <ReactGridLayout
        className="layout"
        layout={layout as any}
        cols={12}
        rowHeight={100}
        width={width}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".chart-drag-handle"
        isResizable={true}
      >
        {charts.map(chart => (
          <div key={chart.id} className="relative group">
            <ChartRenderer sessionId={sessionId} config={chart} globalFilters={globalFilters} />
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => removeChart(chart.id)}
              className="absolute top-2.5 right-9 text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Remove Chart"
              aria-label={`Remove ${chart.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}
