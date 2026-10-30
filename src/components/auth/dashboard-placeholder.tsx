import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CircleCheckBig,
  ClipboardList,
  GraduationCap,
  Hammer,
  LogOut,
  Presentation,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/auth/auth-layout";
import { clearSession, getSession, type AuthSession, type DashboardRole } from "@/lib/mock-auth";

export const DASHBOARD_ROLES: DashboardRole[] = ["student", "faculty", "admin"];

const ROLE_META: Record<
  DashboardRole,
  { label: string; icon: typeof GraduationCap; blurb: string }
> = {
  student: {
    label: "Student Dashboard",
    icon: GraduationCap,
    blurb: "Report hostel, classroom and lab issues in one tap.",
  },
  faculty: {
    label: "Faculty Dashboard",
    icon: Presentation,
    blurb: "Raise and follow maintenance requests for your department.",
  },
  admin: {
    label: "Administrator Dashboard",
    icon: ShieldCheck,
    blurb: "Oversee every campus fix from the Team 42 control room.",
  },
};

const PLACEHOLDER_CARDS = [
  { icon: ClipboardList, title: "Open issues" },
  { icon: Hammer, title: "In progress" },
  { icon: CircleCheckBig, title: "Resolved" },
];

export function DashboardPlaceholder({ role }: { role: DashboardRole }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const existing = getSession();
    if (!existing) {
      navigate({ to: "/" });
      return;
    }
    setSession(existing);
    setChecked(true);
  }, [navigate]);

  if (!checked || !session) return null;

  const meta = ROLE_META[role];

  function handleLogout() {
    clearSession();
    toast.success("Signed out of CampusOS – FixIt.");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <BrandMark />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut /> Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <section className="glass rounded-2xl p-6 sm:p-8">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/30 bg-primary/10 text-primary"
          >
            <meta.icon className="h-3.5 w-3.5" /> {meta.label}
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
            Welcome back, {session.name}!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{meta.blurb}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {session.usn && (
              <>
                USN <span className="font-medium text-foreground">{session.usn}</span> ·{" "}
              </>
            )}
            Role <span className="capitalize text-foreground">{role}</span>
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {PLACEHOLDER_CARDS.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card/40 p-5 transition-colors hover:border-primary/30"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">Coming soon</p>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-3/4 rounded-full bg-secondary" />
                <div className="h-2 w-1/2 rounded-full bg-secondary/70" />
              </div>
            </div>
          ))}
        </section>

        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> This is a placeholder dashboard — the
          full CampusOS – FixIt workspace arrives in the next build.
        </p>
      </main>
    </div>
  );
}
