import { useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  PlayCircle,
  Search,
  ShieldCheck,
  Tag,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  computeAssignedStats,
  getIssueTypes,
  isTicketAssignedToUser,
  isTicketOverdue,
  updateTicketStatus,
  type Ticket,
  type TicketStatus,
} from "@/lib/fixit-store";

interface MyWorksViewProps {
  tickets: Ticket[];
  currentUser: {
    id: string;
    name: string;
    role: "student" | "faculty" | "office_staff" | "admin";
    usn?: string | null;
  };
  onOpenDetails: (ticket: Ticket) => void;
  onOpenStatusModal: (ticket: Ticket) => void;
  onRefresh: () => void;
}

type MyWorksTab = "ALL" | "IN_PROGRESS" | "OPEN" | "RESOLVED" | "OVERDUE";

export function MyWorksView({
  tickets,
  currentUser,
  onOpenDetails,
  onOpenStatusModal,
  onRefresh,
}: MyWorksViewProps) {
  const [activeTab, setActiveTab] = useState<MyWorksTab>("ALL");
  const [selectedIssueType, setSelectedIssueType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const issueTypes = getIssueTypes();

  // All tickets assigned to this staff or faculty member
  const assignedTickets = useMemo(() => {
    return tickets.filter((t) => isTicketAssignedToUser(t, currentUser));
  }, [tickets, currentUser]);

  const stats = useMemo(() => {
    return computeAssignedStats(tickets, currentUser);
  }, [tickets, currentUser]);

  // Filtered tickets based on search, tab, and category
  const filteredWorks = useMemo(() => {
    return assignedTickets.filter((ticket) => {
      // Tab filter
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

      // Category filter
      if (selectedIssueType !== "ALL" && ticket.issue_type_id !== selectedIssueType) {
        return false;
      }

      // Search query
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
  }, [assignedTickets, activeTab, selectedIssueType, searchQuery]);

  function handleStartWork(ticket: Ticket) {
    updateTicketStatus(ticket.id, "IN_PROGRESS", "Staff started working on this maintenance request.");
    toast.success(`Ticket ${ticket.id} marked as In Progress.`);
    onRefresh();
  }

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px]"
          >
            Open / Pending Action
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
            Resolved
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

  const roleLabel =
    currentUser.role === "office_staff"
      ? "Staff Work Orders"
      : currentUser.role === "faculty"
        ? "Faculty Assigned Works"
        : "Assigned Work Orders";

  return (
    <div className="space-y-6">
      {/* ────────────────────── Top Header Banner ────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  My Works
                </h1>
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/15 text-primary text-[11px] font-semibold py-0.5 px-2.5"
                >
                  {roleLabel}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                All maintenance tickets and campus service requests assigned to you by the admin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs py-1 px-3 gap-1.5 font-medium"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>
              {stats.inProgress + stats.open} Active Task
              {stats.inProgress + stats.open === 1 ? "" : "s"}
            </span>
          </Badge>
        </div>
      </div>

      {/* ────────────────────── Metric KPI Cards ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Assigned */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Assigned</span>
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {stats.total}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">From campus admin</p>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">In Progress</span>
            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            {stats.inProgress}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Currently working on</p>
        </div>

        {/* Pending Action */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Action</span>
            <AlertCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
            {stats.open}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Awaiting start</p>
        </div>

        {/* Resolved */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.resolved}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Successfully fixed</p>
        </div>

        {/* Overdue */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            stats.overdue > 0
              ? "border-destructive/50 bg-destructive/10"
              : "border-border bg-card/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Overdue TAT</span>
            <AlertCircle
              className={`h-4 w-4 ${stats.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}
            />
          </div>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight font-mono ${
              stats.overdue > 0 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {stats.overdue}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Past deadline</p>
        </div>
      </div>

      {/* ────────────────────── Tab Filters & Search ────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
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
            All Works ({stats.total})
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
            In Progress ({stats.inProgress})
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
            Pending ({stats.open})
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
            Resolved ({stats.resolved})
          </Button>
          {stats.overdue > 0 && (
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
              Overdue ({stats.overdue})
            </Button>
          )}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assigned works..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-card/60"
            />
          </div>

          <div className="flex items-center gap-1.5">
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
      </div>

      {/* ────────────────────── Assigned Work Cards ────────────────────── */}
      {filteredWorks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/70 text-muted-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground">
            {assignedTickets.length === 0
              ? "No tickets assigned to you yet"
              : "No works matching your current filter"}
          </h3>
          <p className="max-w-md mx-auto text-xs text-muted-foreground">
            {assignedTickets.length === 0
              ? "When the campus admin assigns maintenance tickets or repairs to your profile, they will appear here with target completion deadlines and tracking tools."
              : "Try switching the filter tabs or clearing your search term to see other assigned tickets."}
          </p>
          {assignedTickets.length > 0 && (
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
          {filteredWorks.map((ticket) => {
            const overdue = isTicketOverdue(ticket);
            return (
              <div
                key={ticket.id}
                className={`group rounded-2xl border transition-all duration-200 bg-card/60 hover:bg-card/90 p-5 space-y-4 flex flex-col justify-between ${
                  overdue
                    ? "border-destructive/40 shadow-[0_0_20px_-10px_rgba(239,68,68,0.2)]"
                    : "border-border hover:border-primary/40 shadow-sm"
                }`}
              >
                {/* Card Header */}
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

                  {/* Location & Reported By */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 text-foreground/80 font-medium">
                      <MapPin className="h-3 w-3 text-accent shrink-0" />
                      {ticket.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      Reported by {ticket.created_by_name} ({ticket.created_by_role})
                    </span>
                  </div>
                </div>

                {/* Admin Assignment Metadata Box */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Assigned by {ticket.assigned_by || "Campus Admin"}
                    </span>
                    {ticket.assigned_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(ticket.assigned_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>

                  {ticket.expected_by && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="h-3 w-3 text-amber-500 shrink-0" />
                      <span className="text-muted-foreground">Completion Target:</span>
                      <span
                        className={`font-semibold ${
                          overdue ? "text-destructive font-bold" : "text-foreground"
                        }`}
                      >
                        {new Date(ticket.expected_by).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {ticket.resolution_note && (
                    <div className="pt-1 border-t border-border/50 text-[11px] text-foreground/80">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Resolution Note:{" "}
                      </span>
                      {ticket.resolution_note}
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenDetails(ticket)}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View Details
                  </Button>

                  <div className="flex items-center gap-2">
                    {ticket.status === "OPEN" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartWork(ticket)}
                        className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                      >
                        <PlayCircle className="h-3.5 w-3.5" /> Start Work
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => onOpenStatusModal(ticket)}
                      className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      {ticket.status === "RESOLVED" ? "Update Note" : "Update Status"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
