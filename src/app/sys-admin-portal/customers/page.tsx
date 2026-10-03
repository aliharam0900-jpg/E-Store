"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  Loader2,
  DollarSign,
  ShoppingBag,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCustomersCrm } from "@/lib/services/customers";
import { CustomerProfileDrawer } from "@/components/admin/crm/customer-profile-drawer";
import { formatPrice, formatDate } from "@/lib/utils/format";
import type { CustomerCrmRecord } from "@/types";

export default function CustomersCrmPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "suspended">("all");
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerCrmRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers_crm"],
    queryFn: getCustomersCrm,
  });

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      const matchesQuery =
        !search ||
        c.email.toLowerCase().includes(q) ||
        c.full_name?.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (statusFilter === "active") return !c.is_banned;
      if (statusFilter === "suspended") return c.is_banned;
      return true;
    });
  }, [customers, search, statusFilter]);

  const handleRowClick = (customer: CustomerCrmRecord) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
          <Users className="h-5 w-5" /> Customer Relationship Management (CRM)
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Customer 360 profiles, lifetime value (LTV) telemetry, and edge-level account suspension
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search email, name, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                statusFilter === "all"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                statusFilter === "active"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active ({customers.filter((c) => !c.is_banned).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("suspended")}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                statusFilter === "suspended"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Suspended ({customers.filter((c) => c.is_banned).length})
            </button>
          </div>
        </div>
      </div>

      {/* Customer 360 Data Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground font-mono text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
            <span>AGGREGATING_CUSTOMER_360_PROFILES...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-center p-4">
            <p className="text-sm font-semibold text-foreground font-mono">
              No matching customer profiles
            </p>
            <p className="text-xs text-muted-foreground">
              Adjust search keywords or status filter to locate customer records.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-[11px] font-mono">
                <TableHead>Customer Profile</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Lifetime Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  onClick={() => handleRowClick(customer)}
                  className="text-xs hover:bg-muted/40 cursor-pointer font-mono transition-colors"
                >
                  <TableCell className="font-semibold text-foreground">
                    {customer.full_name || "Anonymous Consumer"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[11px]">
                    {customer.email}
                  </TableCell>
                  <TableCell>
                    {customer.role === "super_admin" ? (
                      <Badge variant="default" className="text-[10px]">
                        SUPER_ADMIN
                      </Badge>
                    ) : customer.role === "store_manager" ? (
                      <Badge variant="secondary" className="text-[10px]">
                        STORE_MANAGER
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px]">
                        CUSTOMER
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {customer.order_count}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {formatPrice(customer.lifetime_value)}
                  </TableCell>
                  <TableCell>
                    {customer.is_banned ? (
                      <Badge variant="destructive" className="text-[9px]">
                        SUSPENDED
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        ACTIVE
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] font-mono gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(customer);
                      }}
                    >
                      Inspect 360 <ChevronRight className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Customer 360 Profile Drawer */}
      <CustomerProfileDrawer
        customer={selectedCustomer}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCustomerUpdated={(updated) => {
          setSelectedCustomer(updated);
        }}
      />
    </div>
  );
}
