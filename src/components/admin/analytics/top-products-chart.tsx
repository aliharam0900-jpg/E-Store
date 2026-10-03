"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format";
import type { TopSellingProductRecord } from "@/types";

interface TopProductsChartProps {
  data: TopSellingProductRecord[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as TopSellingProductRecord;
    return (
      <div className="bg-popover border border-border p-2.5 rounded-md shadow-md text-xs font-mono">
        <p className="font-semibold text-foreground mb-1">{item.product_title}</p>
        <p className="text-muted-foreground flex justify-between gap-4">
          <span>Units Sold:</span>
          <span className="text-foreground font-bold">{item.units_sold}</span>
        </p>
        <p className="text-muted-foreground flex justify-between gap-4">
          <span>Revenue:</span>
          <span className="text-foreground">{formatPrice(item.total_revenue)}</span>
        </p>
      </div>
    );
  }
  return null;
}

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
        <div>
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Top Performing Products by Volume
          </CardTitle>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            Top {data.length} SKUs
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
          UNITS_DISPATCHED
        </span>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center font-mono text-xs text-muted-foreground">
            AGGREGATING_CATALOG_SALES...
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center font-mono text-xs text-muted-foreground">
            NO_ORDER_DISPATCH_RECORDS
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                  opacity={0.6}
                />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} u`}
                />
                <YAxis
                  type="category"
                  dataKey="product_title"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tickFormatter={(val) =>
                    val.length > 12 ? `${val.slice(0, 12)}...` : val
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="units_sold"
                  fill="currentColor"
                  radius={[0, 4, 4, 0]}
                  className="text-foreground"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
