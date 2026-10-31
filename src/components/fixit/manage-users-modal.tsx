import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  GraduationCap,
  Loader2,
  Presentation,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
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
  ADMIN_USER_ROLES,
  ROLE_LABELS,
  createAdminUser,
  deleteAdminUser,
  describeAdminUserError,
  emptyDraft,
  listAdminUsers,
  validateAdminUserDraft,
  type AdminUser,
  type AdminUserDraft,
  type AdminUserRole,
} from "@/lib/admin-users";

interface ManageUsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ListState = "loading" | "ready" | "error";
type Filter = "ALL" | AdminUserRole;

const ROLE_ICONS: Record<AdminUserRole, typeof GraduationCap> = {
  student: GraduationCap,
  faculty: Presentation,
  office_staff: Wrench,
};

const FILTERS: Filter[] = ["ALL", "student", "faculty", "office_staff"];

export function ManageUsersModal({ open, onOpenChange }: ManageUsersModalProps) {
  const [draft, setDraft] = useState<AdminUserDraft>(emptyDraft("student"));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listState, setListState] = useState<ListState>("loading");
  const [listError, setListError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setListState("loading");
    setListError(null);
    try {
      const items = await listAdminUsers();
      setUsers(items);
      setListState("ready");
    } catch (error: unknown) {
      setListError(describeAdminUserError(error));
      setUsers([]);
      setListState("error");
    }
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(emptyDraft("student"));
      setFormError(null);
      setFilter("ALL");
      void loadUsers();
    }
  }, [open, loadUsers]);

  function selectRole(role: AdminUserRole) {
    setDraft(emptyDraft(role));
    setFormError(null);
  }

  function updateField<K extends keyof AdminUserDraft>(key: K, value: AdminUserDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateAdminUserDraft(draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const created = await createAdminUser(draft);
      toast.success(`${created.name} added as ${ROLE_LABELS[created.role].toLowerCase()}.`);
      setDraft(emptyDraft(draft.role));
      await loadUsers();
    } catch (error: unknown) {
      const message = describeAdminUserError(error);
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!window.confirm(`Remove ${user.name} (${user.email_id})?`)) return;
    setDeletingEmail(user.email_id);
    try {
      await deleteAdminUser(user.email_id);
      toast.success(`${user.name} removed.`);
      await loadUsers();
    } catch (error: unknown) {
      toast.error(describeAdminUserError(error));
    } finally {
      setDeletingEmail(null);
    }
  }

  const visibleUsers = filter === "ALL" ? users : users.filter((u) => u.role === filter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold">
                Campus User Management (Admin)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add students, faculty and office staff. Each person signs in with the team's admin
                OTP.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Add user form ── */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card/40 p-4"
        >
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <div className="grid grid-cols-3 gap-2">
              {ADMIN_USER_ROLES.map((role) => {
                const Icon = ROLE_ICONS[role];
                const active = draft.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {ROLE_LABELS[role]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="user-name">
                Full Name
              </Label>
              <Input
                id="user-name"
                value={draft.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className="h-9"
              />
            </div>

            {draft.role === "student" && (
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="user-usn">
                  USN
                </Label>
                <Input
                  id="user-usn"
                  value={draft.usn}
                  onChange={(e) => updateField("usn", e.target.value)}
                  placeholder="e.g. 1RV22CS001"
                  className="h-9 uppercase"
                />
              </div>
            )}

            {draft.role !== "faculty" && (
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="user-dept">
                  Department
                </Label>
                <Input
                  id="user-dept"
                  value={draft.dept}
                  onChange={(e) => updateField("dept", e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="h-9"
                />
              </div>
            )}

            {draft.role !== "student" && (
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="user-designation">
                  Designation
                </Label>
                <Input
                  id="user-designation"
                  value={draft.designation}
                  onChange={(e) => updateField("designation", e.target.value)}
                  placeholder="e.g. Assistant Professor"
                  className="h-9"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs" htmlFor="user-email">
                Email ID
              </Label>
              <Input
                id="user-email"
                type="email"
                value={draft.email_id}
                onChange={(e) => updateField("email_id", e.target.value)}
                placeholder="e.g. ananya@team41.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs" htmlFor="user-phone">
                Phone Number
              </Label>
              <Input
                id="user-phone"
                inputMode="numeric"
                value={draft.phone_number}
                onChange={(e) => updateField("phone_number", e.target.value)}
                placeholder="e.g. 9876543210"
                className="h-9"
              />
            </div>
          </div>

          {formError && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting} className="h-9 gap-1.5 text-xs">
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" /> Add {ROLE_LABELS[draft.role]}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* ── Existing users ── */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    filter === value
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {value === "ALL" ? "All" : ROLE_LABELS[value]}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void loadUsers()}
              disabled={listState === "loading"}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${listState === "loading" ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {listState === "loading" && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/30 py-10 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading registered users…
            </div>
          )}

          {listState === "error" && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 py-8 text-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-xs font-medium text-destructive">{listError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadUsers()}
                className="h-7 text-xs"
              >
                Try again
              </Button>
            </div>
          )}

          {listState === "ready" && visibleUsers.length === 0 && (
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-secondary/20 py-10 text-center">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">No users yet</p>
              <p className="text-[11px] text-muted-foreground">
                {filter === "ALL"
                  ? "Add the first student, faculty or staff member above."
                  : `No ${ROLE_LABELS[filter].toLowerCase()} have been added yet.`}
              </p>
            </div>
          )}

          {listState === "ready" && visibleUsers.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-secondary/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5">USN / Details</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {visibleUsers.map((user) => {
                    const Icon = ROLE_ICONS[user.role];
                    return (
                      <tr key={user.email_id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-3 font-semibold text-foreground">{user.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Icon className="h-3.5 w-3.5" /> {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.usn ? (
                            <span className="font-mono text-foreground">{user.usn}</span>
                          ) : (
                            (user.designation ?? user.dept ?? "—")
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email_id}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(user)}
                            disabled={deletingEmail === user.email_id}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            {deletingEmail === user.email_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
