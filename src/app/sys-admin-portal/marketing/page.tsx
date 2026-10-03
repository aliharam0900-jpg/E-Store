"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Search,
  Download,
  Loader2,
  RefreshCw,
  Calendar,
  Users,
  CheckCircle2,
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
import { toast } from "sonner";
import { getNewsletterSubscribersAction } from "@/app/actions/newsletter";
import { formatDate } from "@/lib/utils/format";
import type { NewsletterSubscriber } from "@/types";

export default function MarketingAdminPage() {
  const [search, setSearch] = React.useState("");

  const {
    data: subscribers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<NewsletterSubscriber[]>({
    queryKey: ["newsletter_subscribers"],
    queryFn: async () => {
      return await getNewsletterSubscribersAction();
    },
  });

  const filteredSubscribers = React.useMemo(() => {
    if (!search.trim()) return subscribers;
    const q = search.toLowerCase();
    return subscribers.filter(
      (sub) =>
        sub.email.toLowerCase().includes(q) ||
        sub.id.toLowerCase().includes(q)
    );
  }, [subscribers, search]);

  const handleExportCSV = () => {
    try {
      // Header row
      const headers = ["ID", "Email", "Subscribed At"];
      
      // Data rows
      const rows = subscribers.map((sub) => [
        `"${sub.id}"`,
        `"${sub.email}"`,
        `"${new Date(sub.subscribed_at).toISOString()}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      // Generate downloadable blob
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute("href", url);
      link.setAttribute("download", `newsletter-subscribers-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        subscribers.length > 0
          ? `Exported ${subscribers.length} subscribers to CSV!`
          : "Exported subscriber schema to CSV!"
      );
    } catch (err: any) {
      console.error("[CSV_EXPORT_ERROR]", err);
      toast.error("Failed to generate CSV export.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Marketing &amp; Newsletters
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage subscriber lists, view audience growth, and export campaigns for external marketing tools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin text-primary" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={isLoading}
            data-testid="export-csv-btn"
            className="h-9 gap-1.5"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Subscribers
            </span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">
              {isLoading ? "..." : subscribers.length}
            </span>
            <span className="text-xs text-muted-foreground">verified contacts</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Status
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              Active
            </span>
            <span className="text-xs text-muted-foreground">Opt-in verified</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">
              Latest Activity
            </span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-semibold truncate">
              {subscribers.length > 0
                ? formatDate(subscribers[0].subscribed_at)
                : "No subscribers yet"}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing {filteredSubscribers.length} of {subscribers.length} subscribers
        </div>
      </div>

      {/* Subscriber Data Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Subscriber Email</TableHead>
              <TableHead className="w-[30%]">Date Joined</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[10%] text-right">Subscriber ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      Loading subscriber list...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Mail className="h-8 w-8 text-muted-foreground/50 mb-1" />
                    <p className="text-sm font-medium text-foreground">
                      {search ? "No matching subscribers found" : "No subscribers yet"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {search
                        ? "Try adjusting your search criteria"
                        : "Subscribers from the storefront footer will appear here."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                        {subscriber.email.charAt(0)}
                      </div>
                      <span className="text-sm">{subscriber.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(subscriber.subscribed_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                      Subscribed
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {subscriber.id.slice(0, 8)}...
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
