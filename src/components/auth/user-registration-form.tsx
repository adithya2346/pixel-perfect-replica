import { useState } from "react";
import { GraduationCap, Loader2, Presentation, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  simulateDelay,
  validateEmail,
  validateMobile,
  validateUsn,
  type NewRegistration,
  type UserRole,
} from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

interface UserRegistrationFormProps {
  initialValues?: Partial<NewRegistration>;
  /** Returns a conflict message to display, or null when the OTP step should start. */
  onOtpRequired: (details: NewRegistration) => string | null;
}

interface RegistrationErrors {
  fullName?: string | undefined;
  usn?: string | undefined;
  email?: string | undefined;
  mobile?: string | undefined;
  role?: string | undefined;
  form?: string | undefined;
}

const ROLE_OPTIONS: { value: UserRole; label: string; icon: typeof GraduationCap }[] = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "faculty", label: "Faculty", icon: Presentation },
];

export function UserRegistrationForm({ initialValues, onOtpRequired }: UserRegistrationFormProps) {
  const [fullName, setFullName] = useState(initialValues?.fullName ?? "");
  const [usn, setUsn] = useState(initialValues?.usn ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [mobile, setMobile] = useState(initialValues?.mobile ?? "");
  const [role, setRole] = useState<UserRole | null>(initialValues?.role ?? null);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: RegistrationErrors = {
      fullName: fullName.trim() ? undefined : "Full name is required.",
      usn: validateUsn(usn) ?? undefined,
      email: validateEmail(email) ?? undefined,
      mobile: validateMobile(mobile) ?? undefined,
      role: role ? undefined : "Select your role.",
    };
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    await simulateDelay(650);
    const conflict = onOtpRequired({
      fullName: fullName.trim(),
      usn: usn.trim().toUpperCase(),
      email: email.trim(),
      mobile: mobile.trim(),
      role: role as UserRole,
    });
    if (conflict) {
      setLoading(false);
      toast.error(conflict);
      setErrors({ form: conflict });
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.form && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          {errors.form}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="reg-name">Full Name</Label>
        <Input
          id="reg-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Ananya Sharma"
          autoComplete="name"
          className="h-11"
        />
        {errors.fullName && (
          <p className="text-xs font-medium text-destructive">{errors.fullName}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-usn" className="flex items-center gap-2">
          USN
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Important
          </span>
        </Label>
        <Input
          id="reg-usn"
          value={usn}
          onChange={(e) => setUsn(e.target.value.toUpperCase())}
          placeholder="e.g. 1RV22CS001"
          autoComplete="off"
          className="h-11 border-primary/50 bg-primary/5"
        />
        <p className="text-[11px] text-muted-foreground">
          Your USN is your campus identity on FixIt — it's used to sign in, so double-check it.
        </p>
        {errors.usn && <p className="text-xs font-medium text-destructive">{errors.usn}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email Address</Label>
        <Input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@campus.edu"
          autoComplete="email"
          className="h-11"
        />
        {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-mobile">Mobile Number</Label>
        <Input
          id="reg-mobile"
          type="tel"
          inputMode="numeric"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="9876543210"
          autoComplete="tel"
          className="h-11"
        />
        {errors.mobile && <p className="text-xs font-medium text-destructive">{errors.mobile}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>I am a</Label>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              aria-pressed={role === value}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all",
                role === value
                  ? "border-primary bg-primary/10 shadow-[0_0_24px_-10px_var(--glow)]"
                  : "border-border bg-card/50 hover:border-primary/40",
              )}
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        {errors.role && <p className="text-xs font-medium text-destructive">{errors.role}</p>}
      </div>
      <Button type="submit" className="h-11 w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Preparing verification…
          </>
        ) : (
          <>
            <UserPlus /> Send verification code
          </>
        )}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Demo mode — the 6-digit code is simulated on screen, no real SMS or email is sent.
      </p>
    </form>
  );
}
