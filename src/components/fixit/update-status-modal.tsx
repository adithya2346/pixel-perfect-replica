import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Clock, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateTicketStatus, type Ticket, type TicketStatus } from "@/lib/fixit-store";

interface UpdateStatusModalProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

/** Today's date in India (Asia/Calcutta) as YYYY-MM-DD, matching the backend TAT rule. */
function indiaToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
}

/**
 * Combine the picked date + time into the stored deadline. The value is built as
 * UTC so the backend receives exactly the date the admin chose.
 */
function toDeadlineIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function UpdateStatusModal({
  ticket,
  open,
  onOpenChange,
  onUpdated,
}: UpdateStatusModalProps) {
  const [status, setStatus] = useState<TicketStatus>("IN_PROGRESS");
  const [resolutionNote, setResolutionNote] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [expectedTime, setExpectedTime] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status === "ACKNOWLEDGED" ? "RESOLVED" : ticket.status);
      setResolutionNote(ticket.resolution_note || "");
      if (ticket.expected_by) {
        setExpectedDate(ticket.expected_by.split("T")[0] ?? "");
        setExpectedTime(ticket.expected_by.split("T")[1]?.slice(0, 5) ?? "18:00");
      } else {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", {
          timeZone: "Asia/Calcutta",
        });
        setExpectedDate(tomorrow);
        setExpectedTime("18:00");
      }
    }
  }, [ticket]);

  if (!ticket) return null;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket) return;

    if (status === "RESOLVED" && !resolutionNote.trim()) {
      toast.error("Please provide a resolution note before marking ticket as resolved.");
      return;
    }

    const deadlineIso = toDeadlineIso(expectedDate, expectedTime);
    if (!deadlineIso) {
      toast.error("Set a valid expected completion date and time.");
      return;
    }
    if (new Date(deadlineIso).getTime() <= Date.now()) {
      toast.error("Expected completion must be in the future — pick a later date or time.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 450));

    updateTicketStatus(ticket.id, status, resolutionNote.trim() || undefined, deadlineIso);

    setSubmitting(false);
    toast.success(`Ticket ${ticket.id} updated to ${status}`);
    onOpenChange(false);
    onUpdated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                Update Ticket Status (CM)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set workflow state, technician notes and turnaround time.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          {/* Ticket ID & Current Status Info */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3">
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Ticket ID
              </span>
              <span className="font-mono text-sm font-bold text-foreground">{ticket.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Current Status
              </span>
              <span className="text-xs font-semibold text-primary">{ticket.status}</span>
            </div>
          </div>

          {/* Change Status */}
          <div className="space-y-1.5">
            <Label htmlFor="change-status" className="text-xs font-semibold">
              Change Status
            </Label>
            <Select value={status} onValueChange={(val) => setStatus(val as TicketStatus)}>
              <SelectTrigger id="change-status" className="h-10">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open (Queued)</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress (Work Assigned)</SelectItem>
                <SelectItem value="RESOLVED">Resolved (Fixed & Ready for Review)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Turnaround Time (TAT) / Expected Date */}
          <div className="space-y-1.5">
            <Label
              htmlFor="expected-date"
              className="text-xs font-semibold flex items-center justify-between"
            >
              <span>Expected Completion Date (TAT)</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-400" /> Overdue trigger
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Input
                  id="expected-date"
                  type="date"
                  min={indiaToday()}
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="h-10 pl-9"
                />
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <Input
                  id="expected-time"
                  type="time"
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                  className="h-10 pl-9"
                />
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Must be a future date and time (India time). Tickets will be flagged as{" "}
              <strong className="text-destructive">Overdue</strong> if not resolved before this.
            </p>
          </div>

          {/* Resolution Note */}
          <div className="space-y-1.5">
            <Label htmlFor="resolution-note" className="text-xs font-semibold">
              Resolution Note {status === "RESOLVED" && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="resolution-note"
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Fan capacitor replaced and balanced. Tested working at all 5 speeds."
            />
            {status === "RESOLVED" && (
              <p className="text-[10px] text-muted-foreground">
                Visible to the student/faculty when acknowledging the fix.
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-28 font-semibold shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Updating…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Update Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
