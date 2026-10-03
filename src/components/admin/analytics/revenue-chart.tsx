"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format";
import type { Revenue30DaysRecord } from "@/types";

interface RevenueChartProps {
  data: Revenue30DaysRecord[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as Revenue30DaysRecord;
    return (
      <div className="bg-popover border border-border p-2.5 rounded-md shadow-md text-xs font-mono">
        <p className="font-semibold text-foreground mb-1">{item.date}</p>
        <p className="text-muted-foreground flex justify-between gap-4">
          <span>Revenue:</span>
          <span className="text-foreground font-bold">{formatPrice(item.revenue)}</span>
        </p>
        <p className="text-muted-foreground flex justify-between gap-4">
          <span>Orders:</span>
          <span className="text-foreground">{item.order_count}</span>
        </p>
      </div>
    );
  }
  return null;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const totalPeriodRevenue = React.useMemo(() => {
    return data.reduce((sum, d) => sum + d.revenue, 0);
  }, [data]);

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
        <div>
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Revenue Velocity (Rolling 30 Days)
          </CardTitle>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {formatPrice(totalPeriodRevenue)}
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          DAILY_ROLLING_WINDOW
        </span>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center font-mono text-xs text-muted-foreground">
            CALCULATING_TIME_SERIES...
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center font-mono text-xs text-muted-foreground">
            NO_HISTORICAL_TRANSACTIONS
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="currentColor"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  className="text-foreground"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
