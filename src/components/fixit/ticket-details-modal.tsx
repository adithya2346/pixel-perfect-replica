import { useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Tag,
  Trash2,
  User,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  acknowledgeTicket,
  assignTicketToStaff,
  deleteTicket,
  isTicketOverdue,
  unassignTicket,
  updateTicket,
  type Ticket,
} from "@/lib/fixit-store";
import { getRegisteredUsers } from "@/lib/mock-auth";

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: { name: string; id: string; role: "student" | "faculty" | "office_staff" | "admin" };
  onTicketUpdated: () => void;
  onOpenStatusModal?: (ticket: Ticket) => void;
}

export function TicketDetailsModal({
  ticket,
  open,
  onOpenChange,
  currentUser,
  onTicketUpdated,
  onOpenStatusModal,
}: TicketDetailsModalProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | undefined>(undefined);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  // Potential assignees from registered users + staff directory
  const assignees = useMemo(() => {
    const reg = getRegisteredUsers().filter(
      (u) => u.role === "office_staff" || u.role === "faculty",
    );
    const defaults = [
      { id: "STF-2024-41", name: "Ravi Shetty", role: "office_staff", label: "Ravi Shetty (Office Staff - Maintenance)" },
      { id: "1RV18CS042", name: "Dr. Priya Raman", role: "faculty", label: "Dr. Priya Raman (Faculty - IT & CS)" },
      { id: "stf-elec-1", name: "Ramesh Kumar", role: "office_staff", label: "Ramesh Kumar (Staff - Electrician)" },
      { id: "stf-plmb-1", name: "Mahesh Patil", role: "office_staff", label: "Mahesh Patil (Staff - Plumber)" },
      { id: "stf-furn-1", name: "Imran Sheikh", role: "office_staff", label: "Imran Sheikh (Staff - Carpenter)" },
      { id: "stf-net-1", name: "Vikram Menon", role: "office_staff", label: "Vikram Menon (Staff - Network Engineer)" },
    ];
    const list = [...defaults];
    for (const u of reg) {
      if (!list.some((item) => item.id === u.usn || item.name.toLowerCase() === u.fullName.toLowerCase())) {
        list.push({
          id: u.usn,
          name: u.fullName,
          role: u.role,
          label: `${u.fullName} (${u.role === "office_staff" ? "Office Staff" : "Faculty"})`,
        });
      }
    }
    return list;
  }, []);

  if (!ticket) return null;

  const overdue = isTicketOverdue(ticket);
  const isReporter =
    ticket.created_by.toLowerCase() === currentUser.id.toLowerCase() ||
    ticket.created_by_name.toLowerCase() === currentUser.name.toLowerCase();
  const isCmOrAdmin = currentUser.role === "admin";
  const canEdit = isCmOrAdmin || (isReporter && ticket.status === "OPEN");
  const canDelete = (isReporter && ticket.status === "OPEN") || isCmOrAdmin;
  const canAcknowledge = isReporter && ticket.status === "RESOLVED";

  const startEdit = () => {
    setEditTitle(ticket.title);
    setEditDesc(ticket.description);
    setEditLocation(ticket.location);
    setEditPhoto(ticket.photo_url);
    setEditing(true);
  };

  const handleAssign = () => {
    if (!ticket || !selectedAssigneeId) return;
    const assignee = assignees.find((a) => a.id === selectedAssigneeId);
    if (!assignee) return;
    assignTicketToStaff(ticket.id, {
      id: assignee.id,
      name: assignee.name,
      role: assignee.role,
      assignedBy: currentUser.name || "Admin",
    });
    toast.success(`Assigned ticket ${ticket.id} to ${assignee.name}.`);
    onTicketUpdated();
  };

  const handleUnassign = () => {
    if (!ticket) return;
    unassignTicket(ticket.id);
    toast.info(`Ticket ${ticket.id} unassigned.`);
    onTicketUpdated();
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !editDesc.trim() || !editLocation.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }
    updateTicket(ticket.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      location: editLocation.trim(),
      photo_url: editPhoto,
    });
    setEditing(false);
    toast.success("Ticket details updated successfully.");
    onTicketUpdated();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ticket ${ticket.id}?`)) {
      deleteTicket(ticket.id);
      toast.success(`Ticket ${ticket.id} deleted.`);
      onOpenChange(false);
      onTicketUpdated();
    }
  };

  const handleAcknowledge = () => {
    acknowledgeTicket(ticket.id);
    toast.success(`Thank you! Ticket ${ticket.id} marked as acknowledged and closed.`);
    onOpenChange(false);
    onTicketUpdated();
  };

  const handleDownloadPhoto = () => {
    if (!ticket.photo_url) return;
    const a = document.createElement("a");
    a.href = ticket.photo_url;
    a.target = "_blank";
    a.download = `${ticket.id}-photo.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Photo opened / download initiated");
  };

  const getStatusBadge = () => {
    switch (ticket.status) {
      case "OPEN":
        return (
          <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400">
            Open
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            In Progress
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            Resolved
          </Badge>
        );
      case "ACKNOWLEDGED":
        return (
          <Badge
            variant="outline"
            className="border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400"
          >
            Acknowledged / Closed
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Ticket Details - {ticket.id}</DialogTitle>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-lg font-bold tracking-tight text-foreground">
                {ticket.id}
              </span>
              {getStatusBadge()}
              {overdue && (
                <Badge variant="destructive" className="gap-1 animate-pulse">
                  <AlertCircle className="h-3 w-3" /> Overdue
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 pr-4">
              {canEdit && !editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 text-destructive hover:bg-destructive/10 text-xs gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Location</Label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Attached Photo</Label>
              {editPhoto ? (
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center gap-2.5">
                    <img src={editPhoto} alt="" className="h-10 w-10 object-cover rounded-md" />
                    <span className="text-xs text-foreground font-medium">Photo attached</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditPhoto(undefined)}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Remove Photo (remove_photo=true)
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground p-2 rounded-xl border border-dashed border-border text-center">
                  No photo attached.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Title & Metadata Grid */}
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">{ticket.title}</h3>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-border/80 bg-secondary/30 p-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Type
                    </p>
                    <p className="font-medium text-foreground">{ticket.issue_type_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Location
                    </p>
                    <p className="font-medium text-foreground truncate">{ticket.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Reported
                    </p>
                    <p className="font-medium text-foreground">
                      {new Date(ticket.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Reported By
                    </p>
                    <p className="font-medium text-foreground">
                      {ticket.created_by_name}{" "}
                      <span className="text-muted-foreground capitalize">
                        ({ticket.created_by_role})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Assigned To
                    </p>
                    <p className="font-medium text-foreground truncate">
                      {ticket.assigned_to_name ? (
                        <>
                          {ticket.assigned_to_name}{" "}
                          <span className="text-muted-foreground capitalize">
                            ({ticket.assigned_to_role || "Staff"})
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </p>
                  </div>
                </div>

                {ticket.expected_by && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Target (TAT)
                      </p>
                      <p
                        className={`font-medium ${overdue ? "text-destructive font-bold" : "text-foreground"}`}
                      >
                        {new Date(ticket.expected_by).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Problem Description
              </Label>
              <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 text-sm text-foreground/90 leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {/* Admin Work Assignment Section */}
            {isCmOrAdmin && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Admin Work Assignment
                    </span>
                  </div>
                  {ticket.assigned_to_name && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleUnassign}
                      className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                    >
                      Remove Assignment
                    </Button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    className="flex-1 h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">
                      {ticket.assigned_to_name
                        ? `Assigned: ${ticket.assigned_to_name} (Select to change)`
                        : "Select staff or faculty member..."}
                    </option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!selectedAssigneeId}
                    onClick={handleAssign}
                    className="h-8 text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shrink-0"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    {ticket.assigned_to_name ? "Reassign Work" : "Assign to Work"}
                  </Button>
                </div>

                {ticket.assigned_to_name && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3 text-primary" />
                    Currently assigned to{" "}
                    <strong className="text-foreground">{ticket.assigned_to_name}</strong>{" "}
                    ({ticket.assigned_to_role || "Staff"}) by {ticket.assigned_by || "Admin"}.
                  </p>
                )}
              </div>
            )}

            {/* Resolution Note if resolved */}
            {ticket.resolution_note && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4" /> Campus Maintenance Resolution Note
                </div>
                <p className="text-xs text-foreground/90 pl-6 leading-relaxed">
                  {ticket.resolution_note}
                </p>
              </div>
            )}

            {/* Photo Section */}
            {ticket.photo_url && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Attached Photo
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPhoto}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Download className="h-3 w-3" /> Download Photo
                  </Button>
                </div>
                <div className="relative rounded-xl border border-border overflow-hidden bg-black/40 group max-h-64 flex justify-center">
                  <img
                    src={ticket.photo_url}
                    alt={ticket.title}
                    className="max-h-64 object-contain w-auto rounded-lg"
                  />
                  <a
                    href={ticket.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-3 w-3" /> Full View
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-wrap items-center justify-between sm:justify-between border-t border-border pt-4 gap-2">
          <div className="flex items-center gap-2">
            {canAcknowledge && (
              <Button
                variant="default"
                size="sm"
                onClick={handleAcknowledge}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-md"
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm Fixed & Close Ticket
              </Button>
            )}

            {isCmOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  if (onOpenStatusModal) onOpenStatusModal(ticket);
                }}
                className="gap-1.5 border-primary/50 text-primary hover:bg-primary/10"
              >
                <Wrench className="h-3.5 w-3.5" /> Update Status & TAT (CM)
              </Button>
            )}
          </div>

          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
