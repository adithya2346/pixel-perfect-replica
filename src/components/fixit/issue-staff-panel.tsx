import { useState } from "react";
import { CalendarClock, CheckCircle2, Phone, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isActiveTicket, isTicketOverdue, type Ticket } from "@/lib/fixit-store";
import {
  appointStaff,
  getAppointedStaffIds,
  getAssignedTicketId,
  getStaffForIssueType,
  releaseStaff,
  type StaffMember,
} from "@/lib/staff-directory";

interface IssueStaffPanelProps {
  issueTypeId: string;
  issueTypeName: string;
  tickets: Ticket[];
  onAppointmentsChanged?: (() => void) | undefined;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface StaffCardProps {
  member: StaffMember;
  appointed: boolean;
  ticket: Ticket | null;
  onAction: () => void;
}

function StaffCard({ member, appointed, ticket, onAction }: StaffCardProps) {
  const overdue = ticket ? isTicketOverdue(ticket) : false;

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
          {initials(member.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold text-foreground">{member.name}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                appointed
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {appointed ? "Working" : "Not working"}
            </span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">{member.role}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Phone className="h-2.5 w-2.5" /> {member.phone}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAction}
          className={`h-7 shrink-0 gap-1 text-[10px] font-semibold ${
            appointed
              ? "border-border text-muted-foreground hover:text-foreground"
              : "border-primary/40 text-primary hover:bg-primary/10"
          }`}
        >
          {appointed ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
          {appointed ? "Release" : "Appoint"}
        </Button>
      </div>

      {appointed && (
        <div className="mt-2.5 rounded-lg border border-border/70 bg-secondary/20 p-2">
          {ticket ? (
            <>
              <p className="truncate text-[10px] font-semibold text-foreground">
                {ticket.id} · {ticket.title}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarClock className="h-2.5 w-2.5" />
                Deadline:
                <span
                  className={`font-semibold ${overdue ? "text-destructive" : "text-foreground"}`}
                >
                  {ticket.expected_by ? formatDeadline(ticket.expected_by) : "Not set"}
                </span>
                {overdue && <span className="font-bold text-destructive">· Overdue</span>}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Status: <span className="font-semibold text-foreground">{ticket.status}</span>
                {ticket.location ? ` · ${ticket.location}` : ""}
              </p>
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              No ticket linked yet — deadline not set.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function IssueStaffPanel({
  issueTypeId,
  issueTypeName,
  tickets,
  onAppointmentsChanged,
}: IssueStaffPanelProps) {
  const staff = getStaffForIssueType(issueTypeId, issueTypeName);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");

  const [appointedIds, setAppointedIds] = useState<string[]>(() =>
    getAppointedStaffIds(issueTypeId),
  );

  // Re-read appointments whenever the admin switches category.
  const [lastCategory, setLastCategory] = useState(issueTypeId);
  if (lastCategory !== issueTypeId) {
    setLastCategory(issueTypeId);
    setAppointedIds(getAppointedStaffIds(issueTypeId));
    setSelectedTicketId("");
  }

  const categoryTickets = tickets.filter(
    (ticket) => ticket.issue_type_id === issueTypeId && isActiveTicket(ticket),
  );

  const ticketById = new Map(categoryTickets.map((ticket) => [ticket.id, ticket]));

  // Appointments always need an active ticket (it supplies the work deadline).
  // Default to the first open ticket in the category so an admin can appoint a
  // worker straight away; an explicit pick from the dropdown still wins.
  const effectiveTicketId = ticketById.has(selectedTicketId)
    ? selectedTicketId
    : (categoryTickets[0]?.id ?? "");

  // A worker counts as appointed as soon as they hold an assignment. The ticket
  // only supplies the deadline, so an appointment can exist without one.
  const rosterIds = new Set(staff.map((member) => member.id));
  const workingIds = new Set(appointedIds.filter((staffId) => rosterIds.has(staffId)));
  const working = staff.filter((member) => workingIds.has(member.id));
  const ready = staff.filter((member) => !workingIds.has(member.id));

  function handleAppoint(member: StaffMember) {
    const ticket = ticketById.get(effectiveTicketId) ?? null;
    appointStaff(issueTypeId, member.id, ticket?.id ?? null);
    setAppointedIds(getAppointedStaffIds(issueTypeId));
    toast.success(
      ticket
        ? `${member.name} appointed to ${ticket.id}.`
        : `${member.name} appointed to ${issueTypeName}.`,
    );
    onAppointmentsChanged?.();
  }

  function handleRelease(member: StaffMember) {
    releaseStaff(issueTypeId, member.id);
    setAppointedIds(getAppointedStaffIds(issueTypeId));
    toast.info(`${member.name} is now ready to accept work.`);
    onAppointmentsChanged?.();
  }

  return (
    <section className="rounded-2xl border border-border bg-card/30 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">
              Staff for {issueTypeName}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {working.length} working · {ready.length} not working
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ticket to assign
          </span>
          <Select
            value={effectiveTicketId}
            onValueChange={setSelectedTicketId}
            disabled={categoryTickets.length === 0}
          >
            <SelectTrigger className="h-8 w-[16rem] text-xs">
              <SelectValue
                placeholder={
                  categoryTickets.length === 0
                    ? "No tickets in this category"
                    : "Select an open ticket"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categoryTickets.map((ticket) => (
                <SelectItem key={ticket.id} value={ticket.id} className="text-xs">
                  {ticket.id} · {ticket.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {categoryTickets.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-secondary/20 px-3 py-3 text-[11px] text-muted-foreground">
          No open tickets in this category. You can still appoint workers — link a ticket above to
          set their deadline.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appointed to work */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Appointed to work ({working.length})
          </p>
          {working.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-secondary/20 px-3 py-6 text-center text-[11px] text-muted-foreground">
              No staff appointed yet for this category.
            </p>
          ) : (
            working.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                appointed
                ticket={ticketById.get(getAssignedTicketId(issueTypeId, member.id) ?? "") ?? null}
                onAction={() => handleRelease(member)}
              />
            ))
          )}
        </div>

        {/* Ready to accept work */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3 w-3" /> Ready to accept work ({ready.length})
          </p>
          {ready.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-secondary/20 px-3 py-6 text-center text-[11px] text-muted-foreground">
              Every staff member is currently appointed.
            </p>
          ) : (
            ready.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                appointed={false}
                ticket={null}
                onAction={() => handleAppoint(member)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
