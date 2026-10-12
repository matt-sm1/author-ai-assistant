"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, FilterTabs } from "@/frontend/components/shared/ui-bits";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function series(range) {
  const n = { "7d": 7, "30d": 30, "3m": 12, "1y": 12 }[range];
  return Array.from({ length: n }, (_, i) => {
    const t = i / n;
    const views = Math.round(1800 + Math.sin(i * 0.9) * 400 + t * 1400 + ((i * 37) % 300));
    const label =
      range === "1y"
        ? MONTHS[i]
        : range === "3m"
          ? `W${i + 1}`
          : new Date(Date.now() - (n - 1 - i) * 86400000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
    return {
      label,
      Views: views,
      Visitors: Math.round(views * 0.62),
      Engagement: Math.round(views * 0.28),
    };
  });
}

export default function AnalyticsChart() {
  const [range, setRange] = useState("30d");
  const data = useMemo(() => series(range), [range]);

  return (
    <Panel className="mt-6 p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Analytics</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {["Views", "Visitors", "Engagement"].map((k, i) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: `var(--chart-${i + 1})` }} />
                {k}
              </span>
            ))}
          </div>
        </div>
        <FilterTabs
          value={range}
          onChange={setRange}
          options={[
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
            { value: "3m", label: "3 Months" },
            { value: "1y", label: "1 Year" },
          ]}
        />
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -20, right: 4 }}>
            <defs>
              {[1, 2, 3].map((i) => (
                <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`var(--chart-${i})`} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={`var(--chart-${i})`} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" minTickGap={20} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)", fontSize: 12 }} />
            <Area type="monotone" dataKey="Views" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g1)" />
            <Area type="monotone" dataKey="Visitors" stroke="var(--chart-2)" strokeWidth={2} fill="url(#g2)" />
            <Area type="monotone" dataKey="Engagement" stroke="var(--chart-3)" strokeWidth={2} fill="url(#g3)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}