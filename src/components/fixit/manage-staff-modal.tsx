import { useReducer, useState } from "react";
import { Users, Wrench } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IssueStaffPanel } from "@/components/fixit/issue-staff-panel";
import { getIssueTypes, type Ticket } from "@/lib/fixit-store";
import { getAppointedStaffIds, getStaffForIssueType } from "@/lib/staff-directory";

interface ManageStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tickets: Ticket[];
}

export function ManageStaffModal({ open, onOpenChange, tickets }: ManageStaffModalProps) {
  const issueTypes = getIssueTypes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Appointments are read straight from the store on every render; this just
  // re-renders when the panel changes one so the counts below stay in step.
  const [, refreshCounts] = useReducer((n: number) => n + 1, 0);

  const activeId = selectedId ?? issueTypes[0]?.id ?? null;
  const activeType = issueTypes.find((type) => type.id === activeId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold">
                Manage Staff (Admin)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pick an issue category to see its workers, then appoint or release them for that
                kind of work.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {issueTypes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-10 text-center text-xs text-muted-foreground">
            No issue categories yet. Add one under Manage Issue Types first.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
            {/* Category list */}
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 px-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Wrench className="h-3 w-3" /> Issue Categories
              </p>
              {issueTypes.map((type) => {
                const roster = getStaffForIssueType(type.id, type.name);
                const appointed = getAppointedStaffIds(type.id).filter((staffId) =>
                  roster.some((member) => member.id === staffId),
                ).length;
                const isActive = type.id === activeId;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedId(type.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                      isActive
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-card/40 hover:bg-secondary/50"
                    }`}
                  >
                    <span
                      className={`block truncate text-xs font-semibold ${
                        isActive ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {type.name}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {appointed} appointed · {roster.length - appointed} ready
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Roster for the selected category */}
            <div>
              {activeType ? (
                <IssueStaffPanel
                  issueTypeId={activeType.id}
                  issueTypeName={activeType.name}
                  tickets={tickets}
                  onAppointmentsChanged={refreshCounts}
                />
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-10 text-center text-xs text-muted-foreground">
                  Select a category to view its staff.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
