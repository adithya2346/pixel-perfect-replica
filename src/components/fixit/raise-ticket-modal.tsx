import { useState } from "react";
import { Camera, ImagePlus, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { createTicket, getIssueTypes, type Ticket } from "@/lib/fixit-store";

interface RaiseTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: { name: string; id: string; role: "student" | "faculty" | "office_staff" | "admin" };
  onTicketCreated: (ticket: Ticket) => void;
}

interface TicketFormErrors {
  issueTypeId?: string;
  title?: string;
  description?: string;
  location?: string;
}

const SAMPLE_PHOTOS = [
  {
    label: "Ceiling Fan",
    url: "https://images.unsplash.com/photo-1594910069352-840801828f73?w=500&auto=format&fit=crop&q=60",
  },
  {
    label: "Water Leakage",
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60",
  },
  {
    label: "Broken Chair",
    url: "https://images.unsplash.com/photo-1503602642458-232111445657?w=500&auto=format&fit=crop&q=60",
  },
];

export function RaiseTicketModal({
  open,
  onOpenChange,
  currentUser,
  onTicketCreated,
}: RaiseTicketModalProps) {
  const issueTypes = getIssueTypes();
  const [issueTypeId, setIssueTypeId] = useState(issueTypes[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<TicketFormErrors>({});

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        toast.success("Photo attached successfully");
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSampleFill() {
    setIssueTypeId(issueTypes[0]?.id || "it-electrical");
    setTitle("Ceiling fan regulator sparking");
    setDescription(
      "When turning regulator dial to speed 4, sparks and burning smell observed from switchboard.",
    );
    setLocation("Room 305, Mechanical Block");
    setPhotoUrl(SAMPLE_PHOTOS[0]?.url ?? "");
    setErrors({});
    toast.info("Sample ticket information loaded");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: TicketFormErrors = {};
    if (!issueTypeId) nextErrors.issueTypeId = "Please select an issue type.";
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!description.trim()) nextErrors.description = "Description is required.";
    if (!location.trim()) nextErrors.location = "Location is required.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));

    const newTicket = createTicket({
      title,
      description,
      issue_type_id: issueTypeId,
      location,
      photo_url: photoUrl || undefined,
      creatorName: currentUser.name,
      creatorId: currentUser.id,
      creatorRole: currentUser.role,
    });

    setSubmitting(false);
    toast.success(`Ticket ${newTicket.id} raised successfully!`);
    onTicketCreated(newTicket);
    onOpenChange(false);

    // Reset form
    setTitle("");
    setDescription("");
    setLocation("");
    setPhotoUrl("");
    setErrors({});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <div>
              <DialogTitle className="font-display text-xl font-bold">Raise a Ticket</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Report a campus maintenance issue to Campus Maintenance (CM).
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSampleFill}
              className="gap-1 text-xs h-8 border-dashed"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Auto-fill Sample
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Issue Type */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-type" className="text-xs font-semibold">
              Issue Type <span className="text-destructive">*</span>
            </Label>
            <Select value={issueTypeId} onValueChange={setIssueTypeId}>
              <SelectTrigger id="issue-type" className="h-10">
                <SelectValue placeholder="Select issue category" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} —{" "}
                    <span className="text-muted-foreground text-xs">{type.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.issueTypeId && <p className="text-xs text-destructive">{errors.issueTypeId}</p>}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title" className="text-xs font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fan not working, Water pipe burst"
              className="h-10"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-location" className="text-xs font-semibold">
              Campus Location <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticket-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Classroom 204, Block B or Boys Hostel 2"
              className="h-10"
            />
            {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc" className="text-xs font-semibold">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ticket-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, urgency, and any details that can help technicians fix it..."
              rows={3}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>Upload Photo (Optional)</span>
              <span className="text-[10px] text-muted-foreground">JPG, PNG up to 5MB</span>
            </Label>

            {photoUrl ? (
              <div className="relative rounded-xl border border-border overflow-hidden bg-secondary/30 p-2 flex items-center gap-3">
                <img
                  src={photoUrl}
                  alt="Attachment preview"
                  className="h-16 w-20 object-cover rounded-lg border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">Photo attached</p>
                  <p className="text-[10px] text-muted-foreground">
                    Will be visible to Campus Maintenance technicians
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPhotoUrl("")}
                  className="h-8 w-8 text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-4 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs font-medium text-foreground">Click to upload photo</span>
                  <span className="text-[10px] text-muted-foreground">
                    or choose one from demo presets below
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {/* Quick preset photo buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Quick Presets:
                  </span>
                  {SAMPLE_PHOTOS.map((sp) => (
                    <button
                      key={sp.label}
                      type="button"
                      onClick={() => setPhotoUrl(sp.url)}
                      className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
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
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Submitting…
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4 mr-1.5" /> Submit Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
