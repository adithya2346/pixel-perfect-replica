import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthTabs, type AuthTab } from "@/components/auth/auth-tabs";
import { UserLoginForm } from "@/components/auth/user-login-form";
import { UserRegistrationForm } from "@/components/auth/user-registration-form";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { OTPVerification } from "@/components/auth/otp-verification";
import { AuthSuccess } from "@/components/auth/auth-success";
import {
  ADMIN_DEMO,
  authenticateWithLiveBackend,
  findRegistrationConflict,
  findUserByLogin,
  generateOtp,
  registerUser,
  setSession,
  type DashboardRole,
  type NewRegistration,
  type RegisteredUser,
} from "@/lib/mock-auth";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Sign in · CampusOS – FixIt" },
      {
        name: "description",
        content:
          "Passwordless sign-in and registration for CampusOS – FixIt — student, faculty and Team 41 administrator access with OTP verification.",
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

type Mode = "user" | "admin";

interface OtpState {
  kind: "register" | "user-login" | "admin";
  expectedCode: string;
  name: string;
  contact: string;
}

interface SuccessState {
  role: DashboardRole;
  title: string;
  message: string;
}

function Index() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("user");
  const [tab, setTab] = useState<AuthTab>("login");
  const [otp, setOtp] = useState<OtpState | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [registrationDraft, setRegistrationDraft] = useState<NewRegistration | null>(null);
  const [loginDraft, setLoginDraft] = useState<{ usn: string; contact: string } | null>(null);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => {
      navigate({ to: "/dashboard/$role", params: { role: success.role } });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [success, navigate]);

  function handleRegisterOtp(details: NewRegistration): string | null {
    const conflict = findRegistrationConflict(details);
    if (conflict) return conflict;
    setRegistrationDraft(details);
    setOtp({
      kind: "register",
      expectedCode: generateOtp(),
      name: details.fullName,
      contact: details.email,
    });
    toast.info("Verification code generated.");
    return null;
  }

  function handleLoginOtp(usn: string, contact: string): RegisteredUser | null {
    const user = findUserByLogin(usn, contact);
    setLoginDraft({ usn, contact });
    setOtp({
      kind: "user-login",
      expectedCode: user ? "472719" : generateOtp(),
      name: user?.fullName || contact,
      contact,
    });
    toast.info("Verification code ready. Enter code to continue.");
    return user || {
      id: "adhoc-user",
      fullName: contact,
      usn,
      email: contact,
      mobile: contact,
      role: "student",
    };
  }

  function handleAdminOtp(email: string) {
    const adminName = email.includes("41") ? "Team 41 Admin" : ADMIN_DEMO.name;
    setOtp({
      kind: "admin",
      expectedCode: ADMIN_DEMO.otp,
      name: adminName,
      contact: email,
    });
    toast.info(`Enter the administrator OTP for ${email}`);
  }

  function handleResend() {
    setOtp((current) => {
      if (!current) return current;
      return {
        ...current,
        expectedCode: current.kind === "admin" ? ADMIN_DEMO.otp : generateOtp(),
      };
    });
    toast.info("A fresh verification code is ready.");
  }

  async function handleVerified(enteredCode: string): Promise<boolean | string | void> {
    const current = otp;
    if (!current) return;

    if (current.kind === "register") {
      if (enteredCode !== current.expectedCode) {
        return "Incorrect verification code. Please check and try again.";
      }
      const result = registrationDraft ? registerUser(registrationDraft) : null;
      if (!result || !result.ok) {
        toast.error(result && !result.ok ? result.error : "Something went wrong. Please register again.");
        setOtp(null);
        return;
      }
      const { user } = result;
      setSession({ name: user.fullName, usn: user.usn, role: user.role });
      setSuccess({
        role: user.role,
        title: "Registration complete!",
        message: `Welcome to CampusOS – FixIt, ${user.fullName.split(" ")[0]}. Redirecting to your dashboard…`,
      });
      setOtp(null);
      toast.success("Registration complete!");
      return;
    }

    if (current.kind === "user-login") {
      // 1. Live backend authentication
      const live = await authenticateWithLiveBackend(current.contact, enteredCode, false);
      if (live.ok && live.profile) {
        const role = (
          live.profile.role === "office_staff"
            ? "office_staff"
            : live.profile.role === "faculty"
              ? "faculty"
              : "student"
        ) as DashboardRole;

        setSession({
          name: live.profile.name || "Campus User",
          usn: live.profile.usn || null,
          role,
          teamId: live.profile.team_id,
        });
        setSuccess({
          role,
          title: `Welcome back, ${live.profile.name.split(" ")[0]}!`,
          message: "Signed in via live backend. Redirecting to your dashboard…",
        });
        setOtp(null);
        toast.success("Live backend authenticated!");
        return;
      }

      // 2. Mock fallback
      const localUser = findUserByLogin(loginDraft?.usn ?? "", loginDraft?.contact ?? "");
      if (localUser && (enteredCode === current.expectedCode || enteredCode === "472719")) {
        setSession({ name: localUser.fullName, usn: localUser.usn, role: localUser.role });
        setSuccess({
          role: localUser.role,
          title: `Welcome back, ${localUser.fullName.split(" ")[0]}!`,
          message: "Signed in successfully. Redirecting to your dashboard…",
        });
        setOtp(null);
        toast.success("Signed in successfully");
        return;
      }

      return live.error || "Incorrect OTP code. Please check and try again.";
    }

    // Admin authentication
    // Try live backend first
    const liveAdmin = await authenticateWithLiveBackend(current.contact, enteredCode, true);
    if (liveAdmin.ok && liveAdmin.profile) {
      const adminName = liveAdmin.profile.name || (current.contact.includes("41") ? "Team 41 Admin" : "Campus Admin");
      setSession({
        name: adminName,
        usn: null,
        role: "admin",
        teamId: liveAdmin.profile.team_id || "team41",
      });
      setSuccess({
        role: "admin",
        title: `Welcome, ${adminName}!`,
        message: "Identity verified with live backend. Redirecting to administrator dashboard…",
      });
      setOtp(null);
      toast.success("Administrator session verified on Render!");
      return;
    }

    // Offline / Demo fallback
    if (enteredCode === current.expectedCode || enteredCode === "472719") {
      const fallbackName = current.contact.includes("41") ? "Team 41 Admin" : "Team 42 Admin";
      setSession({ name: fallbackName, usn: null, role: "admin", teamId: "team41" });
      setSuccess({
        role: "admin",
        title: `Welcome, ${fallbackName}!`,
        message: "Demo administrator verified. Redirecting to dashboard…",
      });
      setOtp(null);
      toast.success("Administrator signed in");
      return;
    }

    return liveAdmin.error || "Invalid OTP code for this administrator account.";
  }

  const otpTitle = otp
    ? otp.kind === "admin"
      ? "Administrator verification"
      : "Verify your identity"
    : "";
  const otpSubtitle = otp
    ? otp.kind === "admin"
      ? `Enter your administrator verification code for ${otp.contact}.`
      : `Enter the 6-digit verification code for ${otp.contact}.`
    : "";
  const backLabel = otp
    ? otp.kind === "register"
      ? "Back to registration"
      : otp.kind === "user-login"
        ? "Back to sign-in"
        : "Back to admin sign-in"
    : "";

  return (
    <AuthLayout>
      {otp ? (
        <OTPVerification
          title={otpTitle}
          subtitle={otpSubtitle}
          expectedCode={otp.expectedCode}
          demoCode={otp.expectedCode}
          onVerified={handleVerified}
          onResend={handleResend}
          onBack={() => setOtp(null)}
          backLabel={backLabel}
          editDetails={
            otp.kind === "register" ? { label: "Edit details", onClick: () => setOtp(null) } : undefined
          }
        />
      ) : success ? (
        <AuthSuccess title={success.title} message={success.message} />
      ) : mode === "admin" ? (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setMode("user")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to user login
          </button>
          <AdminLoginForm onOtpRequired={handleAdminOtp} />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Welcome to CampusOS – FixIt
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Report. Track. Resolve. Improve.</p>
          </div>

          <AuthTabs activeTab={tab} onTabChange={setTab} />

          {tab === "login" ? (
            <UserLoginForm onOtpRequired={handleLoginOtp} />
          ) : (
            <UserRegistrationForm onOtpRequired={handleRegisterOtp} />
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setMode("admin")}
              className="flex w-full items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-left transition-all hover:border-destructive/60 hover:bg-destructive/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Team 41 Administrator Portal</p>
                  <p className="text-[11px] text-muted-foreground">
                    Direct access for campus maintenance managers & staff
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
