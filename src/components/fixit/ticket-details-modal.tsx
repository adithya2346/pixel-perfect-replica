import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  ExternalLink,
  MapPin,
  Tag,
  Trash2,
  User,
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
  deleteTicket,
  isTicketOverdue,
  updateTicket,
  type Ticket,
} from "@/lib/fixit-store";

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: { name: string; id: string; role: "student" | "faculty" | "admin" };
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

  if (!ticket) return null;

  const overdue = isTicketOverdue(ticket);
  const isReporter =
    ticket.created_by.toLowerCase() === currentUser.id.toLowerCase() ||
    ticket.created_by_name.toLowerCase() === currentUser.name.toLowerCase();
  const isCmOrAdmin = currentUser.role === "admin";
  const canEdit = isReporter && ticket.status === "OPEN";
  const canDelete = (isReporter && ticket.status === "OPEN") || isCmOrAdmin;
  const canAcknowledge = isReporter && ticket.status === "RESOLVED";

  function startEdit() {
    setEditTitle(ticket.title);
    setEditDesc(ticket.description);
    setEditLocation(ticket.location);
    setEditing(true);
  }

  function handleSaveEdit() {
    if (!editTitle.trim() || !editDesc.trim() || !editLocation.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }
    updateTicket(ticket.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      location: editLocation.trim(),
    });
    setEditing(false);
    toast.success("Ticket details updated successfully.");
    onTicketUpdated();
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete ticket ${ticket.id}?`)) {
      deleteTicket(ticket.id);
      toast.success(`Ticket ${ticket.id} deleted.`);
      onOpenChange(false);
      onTicketUpdated();
    }
  }

  function handleAcknowledge() {
    acknowledgeTicket(ticket.id);
    toast.success(`Thank you! Ticket ${ticket.id} marked as acknowledged and closed.`);
    onOpenChange(false);
    onTicketUpdated();
  }

  function handleDownloadPhoto() {
    if (!ticket.photo_url) return;
    const a = document.createElement("a");
    a.href = ticket.photo_url;
    a.target = "_blank";
    a.download = `${ticket.id}-photo.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Photo opened / download initiated");
  }

  const getStatusBadge = () => {
    switch (ticket.status) {
      case "OPEN":
        return <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-400">Open</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400">In Progress</Badge>;
      case "RESOLVED":
        return <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400">Resolved</Badge>;
      case "ACKNOWLEDGED":
        return <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-400">Acknowledged / Closed</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Ticket Details - {ticket.id}</DialogTitle>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-lg font-bold tracking-tight text-foreground">{ticket.id}</span>
              {getStatusBadge()}
              {overdue && (
                <Badge variant="destructive" className="gap-1 animate-pulse">
                  <AlertCircle className="h-3 w-3" /> Overdue
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 pr-4">
              {canEdit && !editing && (
                <Button variant="outline" size="sm" onClick={startEdit} className="h-8 gap-1.5 text-xs">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="sm" onClick={handleDelete} className="h-8 text-destructive hover:bg-destructive/10 text-xs gap-1.5">
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Type</p>
                    <p className="font-medium text-foreground">{ticket.issue_type_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
                    <p className="font-medium text-foreground truncate">{ticket.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Reported</p>
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Reported By</p>
                    <p className="font-medium text-foreground">
                      {ticket.created_by_name} <span className="text-muted-foreground capitalize">({ticket.created_by_role})</span>
                    </p>
                  </div>
                </div>

                {ticket.expected_by && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Target (TAT)</p>
                      <p className={`font-medium ${overdue ? "text-destructive font-bold" : "text-foreground"}`}>
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
