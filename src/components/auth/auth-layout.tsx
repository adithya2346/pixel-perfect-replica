import type { ReactNode } from "react";
import { ClipboardCheck, ShieldCheck, Wrench, Zap } from "lucide-react";

import authVisual from "@/assets/auth-visual.jpg";
import { cn } from "@/lib/utils";
import { ThemeSegmentedToggle, ThemeToggle } from "@/components/ui/theme-toggle";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="logo-glow relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
        <Wrench className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-bold tracking-tight text-foreground">
          CampusOS <span className="text-gradient">FixIt</span>
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Report · Track · Resolve · Improve
        </p>
      </div>
    </div>
  );
}

const PANEL_FEATURES = [
  {
    icon: Zap,
    title: "Passwordless by design",
    text: "Sign in with a one-time code — no passwords to remember.",
  },
  {
    icon: ClipboardCheck,
    title: "Every fix, tracked",
    text: "Follow reported issues from open to resolved in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Administrator portal",
    text: "A separate secure entry point for the Team 41 admin team.",
  },
];

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 lg:grid lg:min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <img
          src={authVisual}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-50 dark:opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="relative z-10 p-10 flex items-center justify-between">
          <BrandMark />
          <ThemeSegmentedToggle />
        </div>
        <div className="relative z-10 max-w-lg p-10 pb-14">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Campus maintenance, <span className="text-gradient">solved together.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Welcome to CampusOS – FixIt. Raise issues in seconds, follow every fix in real time and
            help make campus better for everyone.
          </p>
          <ul className="mt-9 space-y-4">
            {PANEL_FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{title}</span>
                  <span className="block text-xs text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:min-h-0 lg:justify-center lg:py-10">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="mb-6 flex items-center justify-between">
            <div className="lg:hidden">
              <BrandMark />
            </div>
            <div className="ml-auto">
              <ThemeToggle showLabel className="shadow-sm" />
            </div>
          </div>
          {children}
        </div>
        <p className="mx-auto mt-10 w-full max-w-md text-center text-[11px] leading-relaxed text-muted-foreground">
          Demo experience · Authentication is simulated on the frontend · No real OTP messages are
          sent
        </p>
      </main>
    </div>
  );
}
