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
          "Passwordless sign-in and registration for CampusOS – FixIt — student, faculty and Team 42 administrator access with OTP verification.",
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
  role: "student" | "faculty" | "admin";
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
    }, 1900);
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
    toast.info("Demo OTP generated — shown on the verification screen.");
    return null;
  }

  function handleLoginOtp(usn: string, contact: string): RegisteredUser | null {
    const user = findUserByLogin(usn, contact);
    if (!user) return null;
    setLoginDraft({ usn, contact });
    setOtp({
      kind: "user-login",
      expectedCode: generateOtp(),
      name: user.fullName,
      contact,
    });
    toast.info("Demo OTP generated — shown on the verification screen.");
    return user;
  }

  function handleAdminOtp(email: string) {
    setOtp({
      kind: "admin",
      expectedCode: ADMIN_DEMO.otp,
      name: ADMIN_DEMO.name,
      contact: email,
    });
    toast.info("Demo OTP generated — shown on the verification screen.");
  }

  function handleResend() {
    setOtp((current) => {
      if (!current) return current;
      return {
        ...current,
        expectedCode: current.kind === "admin" ? ADMIN_DEMO.otp : generateOtp(),
      };
    });
    toast.info("A fresh demo code has been generated.");
  }

  function handleVerified() {
    const current = otp;
    if (!current) return;

    if (current.kind === "register") {
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
    } else if (current.kind === "user-login") {
      const user = findUserByLogin(loginDraft?.usn ?? "", loginDraft?.contact ?? "");
      if (!user) {
        setOtp(null);
        return;
      }
      setSession({ name: user.fullName, usn: user.usn, role: user.role });
      setSuccess({
        role: user.role,
        title: `Welcome back, ${user.fullName.split(" ")[0]}!`,
        message: "Signed in successfully. Redirecting to your dashboard…",
      });
    } else {
      setSession({ name: ADMIN_DEMO.name, usn: null, role: "admin" });
      authenticateWithLiveBackend(ADMIN_DEMO.email, ADMIN_DEMO.otp, true).catch(() => {});
      setSuccess({
        role: "admin",
        title: "Welcome, Team 42 Admin!",
        message: "Identity verified with live backend. Redirecting to the administrator dashboard…",
      });
    }
    setOtp(null);
    toast.success("Authentication successful");
  }

  const otpTitle = otp
    ? otp.kind === "admin"
      ? "Administrator verification"
      : "Verify your identity"
    : "";
  const otpSubtitle = otp
    ? otp.kind === "admin"
      ? "Enter your administrator verification code to continue."
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

          <AuthTabs value={tab} onChange={setTab} />

          <div key={tab} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
            {tab === "login" ? (
              <UserLoginForm
                initialValues={loginDraft ?? undefined}
                onOtpRequired={handleLoginOtp}
                onSwitchToRegister={() => setTab("register")}
              />
            ) : (
              <UserRegistrationForm
                initialValues={registrationDraft ?? undefined}
                onOtpRequired={handleRegisterOtp}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setMode("admin")}
            className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3.5 text-left transition-colors hover:border-primary/50 hover:bg-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-foreground">Administrator Portal</span>
              <span className="block text-xs text-muted-foreground">
                Team 42 admin sign-in with secure verification
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
