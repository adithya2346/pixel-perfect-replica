import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Plus,
  Search,
  Tag,
  Ticket as TicketIcon,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  acknowledgeTicket,
  deleteTicket,
  getIssueTypes,
  isTicketCreatedByUser,
  isTicketOverdue,
  type Ticket,
  type TicketStatus,
} from "@/lib/fixit-store";

interface MyTicketsViewProps {
  tickets: Ticket[];
  currentUser: {
    id: string;
    name: string;
    role: "student" | "faculty" | "office_staff" | "admin";
    usn?: string | null;
  };
  onOpenDetails: (ticket: Ticket) => void;
  onOpenRaise: () => void;
  onRefresh: () => void;
}

type MyTicketsTab = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "OVERDUE";

export function MyTicketsView({
  tickets,
  currentUser,
  onOpenDetails,
  onOpenRaise,
  onRefresh,
}: MyTicketsViewProps) {
  const [activeTab, setActiveTab] = useState<MyTicketsTab>("ALL");
  const [selectedIssueType, setSelectedIssueType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const issueTypes = getIssueTypes();

  // All tickets created/reported by the current user
  const myReportedTickets = useMemo(() => {
    return tickets.filter((t) => isTicketCreatedByUser(t, currentUser));
  }, [tickets, currentUser]);

  // Stats for this user's tickets
  const myStats = useMemo(() => {
    const total = myReportedTickets.length;
    const open = myReportedTickets.filter((t) => t.status === "OPEN").length;
    const inProgress = myReportedTickets.filter((t) => t.status === "IN_PROGRESS").length;
    const resolved = myReportedTickets.filter(
      (t) => t.status === "RESOLVED" || t.status === "ACKNOWLEDGED",
    ).length;
    const overdue = myReportedTickets.filter(isTicketOverdue).length;

    return { total, open, inProgress, resolved, overdue };
  }, [myReportedTickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return myReportedTickets.filter((ticket) => {
      const overdue = isTicketOverdue(ticket);
      if (activeTab === "OPEN" && ticket.status !== "OPEN") return false;
      if (activeTab === "IN_PROGRESS" && ticket.status !== "IN_PROGRESS") return false;
      if (
        activeTab === "RESOLVED" &&
        ticket.status !== "RESOLVED" &&
        ticket.status !== "ACKNOWLEDGED"
      ) {
        return false;
      }
      if (activeTab === "OVERDUE" && !overdue) return false;

      if (selectedIssueType !== "ALL" && ticket.issue_type_id !== selectedIssueType) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          ticket.id.toLowerCase().includes(q) ||
          ticket.title.toLowerCase().includes(q) ||
          ticket.description.toLowerCase().includes(q) ||
          ticket.location.toLowerCase().includes(q) ||
          ticket.issue_type_name.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [myReportedTickets, activeTab, selectedIssueType, searchQuery]);

  function handleAcknowledge(ticket: Ticket) {
    acknowledgeTicket(ticket.id);
    toast.success(`Thank you! Ticket ${ticket.id} marked as confirmed fixed & closed.`);
    onRefresh();
  }

  function handleDelete(ticket: Ticket) {
    if (confirm(`Are you sure you want to delete your ticket ${ticket.id}?`)) {
      deleteTicket(ticket.id);
      toast.success(`Ticket ${ticket.id} deleted.`);
      onRefresh();
    }
  }

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px]"
          >
            Open / In Queue
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px]"
          >
            In Progress
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]"
          >
            Resolved · Fixed
          </Badge>
        );
      case "ACKNOWLEDGED":
        return (
          <Badge
            variant="outline"
            className="border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[11px]"
          >
            Closed & Acknowledged
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ────────────────────── Header Banner ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <TicketIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                My Tickets
              </h1>
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/15 text-primary text-[11px] font-semibold py-0.5 px-2.5"
              >
                Reported by You ({myStats.total})
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Monitor the status, target completion, and technician updates for all campus issues you
              raised.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={onOpenRaise}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" /> Raise New Ticket
          </Button>
        </div>
      </div>

      {/* ────────────────────── Metric KPI Cards ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Reported */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Reported by You</span>
            <TicketIcon className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {myStats.total}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Total campus tickets</p>
        </div>

        {/* Open */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Open</span>
            <AlertCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
            {myStats.open}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">In dispatch queue</p>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">In Progress</span>
            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            {myStats.inProgress}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Technician assigned</p>
        </div>

        {/* Resolved */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            {myStats.resolved}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Fixed & verified</p>
        </div>

        {/* Overdue */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            myStats.overdue > 0
              ? "border-destructive/50 bg-destructive/10"
              : "border-border bg-card/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Overdue TAT</span>
            <AlertCircle
              className={`h-4 w-4 ${myStats.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}
            />
          </div>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight font-mono ${
              myStats.overdue > 0 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {myStats.overdue}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Past completion target</p>
        </div>
      </div>

      {/* ────────────────────── Tab Filters & Search ────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-border bg-secondary/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("ALL")}
            className={`h-7 px-3 text-xs rounded-lg ${
              activeTab === "ALL"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({myStats.total})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("OPEN")}
            className={`h-7 px-3 text-xs rounded-lg ${
              activeTab === "OPEN"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Open ({myStats.open})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("IN_PROGRESS")}
            className={`h-7 px-3 text-xs rounded-lg ${
              activeTab === "IN_PROGRESS"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            In Progress ({myStats.inProgress})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("RESOLVED")}
            className={`h-7 px-3 text-xs rounded-lg ${
              activeTab === "RESOLVED"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Resolved ({myStats.resolved})
          </Button>
          {myStats.overdue > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("OVERDUE")}
              className={`h-7 px-3 text-xs rounded-lg ${
                activeTab === "OVERDUE"
                  ? "bg-destructive text-destructive-foreground font-semibold shadow-sm"
                  : "text-destructive hover:bg-destructive/10"
              }`}
            >
              Overdue ({myStats.overdue})
            </Button>
          )}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search your tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-card/60"
            />
          </div>

          <select
            value={selectedIssueType}
            onChange={(e) => setSelectedIssueType(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card/60 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            {issueTypes.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ────────────────────── Ticket Cards ────────────────────── */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/70 text-muted-foreground">
            <TicketIcon className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground">
            {myReportedTickets.length === 0
              ? "You haven't reported any tickets yet"
              : "No tickets matching your filter"}
          </h3>
          <p className="max-w-md mx-auto text-xs text-muted-foreground">
            {myReportedTickets.length === 0
              ? "Found something broken, damaged, or malfunctioning on campus? Click 'Raise New Ticket' to submit your request."
              : "Try switching filter tabs or clearing your search term to view other tickets."}
          </p>
          {myReportedTickets.length === 0 ? (
            <Button onClick={onOpenRaise} size="sm" className="gap-2 text-xs font-semibold">
              <Plus className="h-4 w-4" /> Raise Your First Ticket
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("ALL");
                setSelectedIssueType("ALL");
                setSearchQuery("");
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => {
            const overdue = isTicketOverdue(ticket);
            const isResolved = ticket.status === "RESOLVED";

            return (
              <div
                key={ticket.id}
                className={`group rounded-2xl border transition-all duration-200 bg-card/60 hover:bg-card/90 p-5 space-y-4 flex flex-col justify-between ${
                  overdue
                    ? "border-destructive/40 shadow-[0_0_20px_-10px_rgba(239,68,68,0.2)]"
                    : isResolved
                      ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                      : "border-border hover:border-primary/40 shadow-sm"
                }`}
              >
                {/* Header Row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold tracking-tight text-foreground">
                        {ticket.id}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-foreground">
                        <Tag className="h-2.5 w-2.5 text-primary" />
                        {ticket.issue_type_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {overdue && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] py-0 px-1.5 gap-1 animate-pulse"
                        >
                          <AlertCircle className="h-2.5 w-2.5" /> Overdue
                        </Badge>
                      )}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {ticket.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Location & Dates */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 text-foreground/80 font-medium">
                      <MapPin className="h-3 w-3 text-accent shrink-0" />
                      {ticket.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Reported {new Date(ticket.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {ticket.expected_by && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                        Target: {new Date(ticket.expected_by).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Resolution Note Banner if Resolved */}
                {ticket.resolution_note && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Maintenance Resolution Note
                    </div>
                    <p className="text-[11px] text-foreground/90 pl-5 leading-relaxed">
                      {ticket.resolution_note}
                    </p>
                  </div>
                )}

                {/* Assigned Technician Info */}
                {ticket.assigned_to_name && (
                  <div className="rounded-xl border border-border/80 bg-secondary/20 px-3 py-2 text-[11px] flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Assigned Technician:</span>
                    <span className="font-semibold text-foreground">
                      {ticket.assigned_to_name} ({ticket.assigned_to_role || "Staff"})
                    </span>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDetails(ticket)}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      View Details
                    </Button>
                    {ticket.status === "OPEN" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ticket)}
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    )}
                  </div>

                  {ticket.status === "RESOLVED" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAcknowledge(ticket)}
                      className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm font-semibold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Fixed & Close
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

