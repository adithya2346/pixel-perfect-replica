import { useState } from "react";
import { Edit2, Plus, Sparkles, Tag, Trash2, Wrench } from "lucide-react";
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
  addIssueType,
  deleteIssueType,
  getIssueTypes,
  updateIssueType,
  type IssueType,
} from "@/lib/fixit-store";

interface IssueTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypesUpdated: () => void;
}

export function IssueTypesModal({ open, onOpenChange, onTypesUpdated }: IssueTypesModalProps) {
  const [types, setTypes] = useState<IssueType[]>(getIssueTypes());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function refresh() {
    setTypes(getIssueTypes());
    onTypesUpdated();
  }

  function startAdd() {
    setName("");
    setDescription("");
    setEditingId(null);
    setIsAdding(true);
  }

  function startEdit(t: IssueType) {
    setName(t.name);
    setDescription(t.description);
    setEditingId(t.id);
    setIsAdding(false);
  }

  function cancelForm() {
    setIsAdding(false);
    setEditingId(null);
    setName("");
    setDescription("");
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    if (editingId) {
      updateIssueType(editingId, { name: name.trim(), description: description.trim() });
      toast.success(`Category "${name}" updated.`);
    } else {
      addIssueType({ name: name.trim(), description: description.trim() });
      toast.success(`Category "${name}" added.`);
    }

    cancelForm();
    refresh();
  }

  function handleDelete(id: string, typeName: string) {
    if (confirm(`Delete issue category "${typeName}"?`)) {
      deleteIssueType(id);
      toast.success(`Category "${typeName}" deleted.`);
      refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl font-bold">
                  Issue Type Management (Admin / CM)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Manage categories shown in the "Raise a Ticket" dropdown.
                </DialogDescription>
              </div>
            </div>

            {!isAdding && !editingId && (
              <Button size="sm" onClick={startAdd} className="h-8 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Type
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Add / Edit Form */}
        {(isAdding || editingId) && (
          <form
            onSubmit={handleSave}
            className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3"
          >
            <h4 className="font-semibold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />{" "}
              {editingId ? "Edit Category" : "Add New Category"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HVAC / Air Conditioning"
                  className="h-9"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description / Keywords</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. AC unit, filter, thermostat"
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelForm}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs">
                {editingId ? "Save Changes" : "Create Type"}
              </Button>
            </div>
          </form>
        )}

        {/* Table of Types */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/50 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {types.map((t) => (
                <tr key={t.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-primary" />
                    <span>{t.name}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{t.description}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(t)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(t.id, t.name)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
