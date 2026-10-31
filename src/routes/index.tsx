import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_PATTERN, setSession, signInWithOtp, type DashboardRole } from "@/lib/mock-auth";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Sign in · CampusOS – FixIt" },
      {
        name: "description",
        content:
          "Passwordless sign-in for CampusOS – FixIt — enter your email ID and one-time code for student, faculty, staff and administrator access.",
      },
      { property: "og:title", content: "Sign in · CampusOS – FixIt" },
      {
        property: "og:description",
        content: "Report. Track. Resolve. Improve. Sign in to the campus maintenance platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function mapRole(role: string): DashboardRole {
  if (role === "admin") return "admin";
  if (role === "faculty") return "faculty";
  if (role === "office_staff") return "office_staff";
  return "student";
}

function Index() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanEmail = email.trim();
    const cleanOtp = otp.trim();

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^[0-9]{4,8}$/.test(cleanOtp)) {
      setError("Enter the one-time code sent to your email.");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await signInWithOtp(cleanEmail, cleanOtp);

    setLoading(false);
    if (!result.ok || !result.profile) {
      setError(result.error || "Invalid email or one-time code.");
      return;
    }

    const role = mapRole(result.profile.role);
    setSession({
      name: result.profile.name || "Campus User",
      usn: result.profile.usn ?? null,
      role,
      teamId: result.profile.team_id,
    });
    toast.success("Signed in successfully");
    navigate({ to: "/dashboard/$role", params: { role } });
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Sign in to CampusOS – FixIt
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One secure entry point for students, faculty, staff and administrators.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email ID</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-otp">One-Time Code (OTP)</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                placeholder="Enter the code from your email"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, ""))}
                className="pl-9 tracking-[0.3em]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          The one-time code is sent to your registered email — it is never displayed on this page.
        </p>
      </div>
    </AuthLayout>
  );
}
