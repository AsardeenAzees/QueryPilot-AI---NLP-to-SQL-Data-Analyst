"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { QueryResponse } from "@/lib/query/schemas";

const COLORS = ["#0ea5e9", "#6366f1", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6"];

export default function ResultChart({ result }: { result: QueryResponse }) {
  const { chart, rows } = result;
  const chartRows = useMemo(() => rows.slice(0, 20), [rows]);
  if (chart.type === "none" || !chart.xKey || !chart.yKey || chartRows.length === 0) return null;
  if (!chartRows.some((row) => typeof row[chart.yKey as string] === "number")) return null;
  const common = { data: chartRows, margin: { top: 8, right: 12, bottom: 12, left: 0 } };
  const tooltipStyle = { background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)" };
  return (
    <Card className="p-4 sm:p-6" aria-label="Result chart">
      <div className="mb-5 flex items-center gap-2"><BarChart3 className="size-4 text-[var(--accent)]" aria-hidden="true" /><h3 className="text-sm font-bold text-[var(--text)]">Visual breakdown</h3></div>
      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "bar" ? (
            <BarChart {...common}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey={chart.xKey} stroke="var(--text-subtle)" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={75} /><YAxis stroke="var(--text-subtle)" tick={{ fontSize: 11 }} width={50} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--chart-cursor)" }} /><Bar dataKey={chart.yKey} fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={48} /></BarChart>
          ) : chart.type === "line" ? (
            <LineChart {...common}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey={chart.xKey} stroke="var(--text-subtle)" tick={{ fontSize: 11 }} /><YAxis stroke="var(--text-subtle)" tick={{ fontSize: 11 }} width={50} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey={chart.yKey} stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} /></LineChart>
          ) : chart.type === "pie" ? (
            <PieChart><Pie data={chartRows} dataKey={chart.yKey} nameKey={chart.xKey} innerRadius="45%" outerRadius="75%" paddingAngle={2}>{chartRows.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend /></PieChart>
          ) : (
            <ScatterChart {...common}><CartesianGrid stroke="var(--chart-grid)" /><XAxis dataKey={chart.xKey} name={chart.xKey} stroke="var(--text-subtle)" tick={{ fontSize: 11 }} /><YAxis dataKey={chart.yKey} name={chart.yKey} stroke="var(--text-subtle)" tick={{ fontSize: 11 }} width={50} /><Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} /><Scatter data={chartRows} fill="#0ea5e9" /></ScatterChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
