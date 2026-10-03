"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Package, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LowStockVariant } from "@/lib/services/analytics";

interface LowStockTableProps {
  variants: LowStockVariant[];
  isLoading?: boolean;
}

export function LowStockTable({ variants, isLoading }: LowStockTableProps) {
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          <div>
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Critical Inventory Depletion (&lt; 10 Units)
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Variants requiring procurement order replenishment
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
          {variants.length} VARIANT(S) AT RISK
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="h-44 flex items-center justify-center font-mono text-xs text-muted-foreground">
            SCANNING_WAREHOUSE_LEVELS...
          </div>
        ) : variants.length === 0 ? (
          <div className="h-36 flex flex-col items-center justify-center gap-1 font-mono text-xs text-muted-foreground text-center p-4">
            <Package className="h-5 w-5 text-emerald-500" />
            <span className="text-emerald-500 font-semibold mt-1">
              INVENTORY_HEALTH_OPTIMAL
            </span>
            <span className="text-[10px] text-muted-foreground">
              All published variant stock levels exceed critical threshold (≥ 10 units)
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent text-[11px]">
                  <TableHead className="font-mono">Product Title</TableHead>
                  <TableHead className="font-mono">SKU</TableHead>
                  <TableHead className="font-mono">Variant Config</TableHead>
                  <TableHead className="font-mono text-right">Stock</TableHead>
                  <TableHead className="font-mono text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((v) => {
                  const isDepleted = v.inventory_count <= 0;
                  const isExtremelyLow = v.inventory_count < 5;

                  return (
                    <TableRow key={v.id} className="text-xs hover:bg-muted/40">
                      <TableCell className="font-medium text-foreground">
                        {v.product?.title || "Unknown Product"}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {v.sku}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                          {v.size && <span>Size: {v.size}</span>}
                          {v.size && v.color && <span>•</span>}
                          {v.color && <span>Color: {v.color}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            isDepleted
                              ? "destructive"
                              : isExtremelyLow
                              ? "default"
                              : "secondary"
                          }
                          className="font-mono text-[10px]"
                        >
                          {v.inventory_count} LEFT
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {v.product?.id ? (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[10px] font-mono gap-1"
                          >
                            <Link
                              href={`/sys-admin-portal/products/${v.product.id}/edit`}
                            >
                              Restock <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
