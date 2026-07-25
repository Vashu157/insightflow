"use client";

import { useRef } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Download, Trash2 } from "lucide-react";
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

  if (isLoading) return <div className="flex h-full items-center justify-center text-slate-500">Loading chart...</div>;
  if (!data || data.data?.length === 0 || data.length === 0) return <div className="flex h-full items-center justify-center text-slate-500">No data available</div>;

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
            <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} tickFormatter={(val: string) => typeof val === 'string' && val.length > 10 ? val.substring(0, 10) + '...' : val} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
            <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'Line':
        return (
          <LineChart data={chartData}>
            <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
            <Line type="monotone" dataKey={yKey} stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        );
      case 'Area':
        return (
          <AreaChart data={chartData}>
            <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
            <Area type="monotone" dataKey={yKey} stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          </AreaChart>
        );
      case 'Pie':
        return (
          <PieChart>
            <Pie data={chartData} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius="80%" label>
              {chartData.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
            <Legend />
          </PieChart>
        );
      case 'Scatter':
        return (
          <ScatterChart>
            <XAxis type="number" dataKey={config.x_column} name={config.x_column} stroke="#64748b" fontSize={12} />
            <YAxis type="number" dataKey={config.y_column} name={config.y_column} stroke="#64748b" fontSize={12} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
            <Scatter data={chartData} fill="#f97316" />
          </ScatterChart>
        );
      default:
        return <div className="flex h-full items-center justify-center text-rose-400">Unsupported chart type</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-800 shadow-xl overflow-hidden" ref={chartRef}>
      <div className="flex justify-between items-center p-3 border-b border-slate-800/50 bg-slate-900 cursor-move chart-drag-handle">
        <h4 className="text-sm font-semibold text-slate-200">{config.title}</h4>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={downloadImage} className="text-slate-500 hover:text-indigo-400" title="Export PNG">
          <Download className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 p-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
        <p className="text-slate-500">Your dashboard is empty. Click &quot;Add Chart&quot; to get started!</p>
      </div>
    );
  }

  const layout: LayoutItem[] = charts.map(c => ({ i: c.id, x: c.x, y: c.y, w: c.w, h: c.h, minW: 3, minH: 2 } as LayoutItem));

  const ReactGridLayout = GridLayout as any;

  return (
    <ReactGridLayout
      className="layout"
      layout={layout as any}
      cols={12}
      rowHeight={100}
      width={1200}
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
            className="absolute top-3 right-10 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="Remove Chart"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </ReactGridLayout>
  );
}
