import { useState } from "react";
import { KeyRound, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EMAIL_PATTERN,
  MOBILE_PATTERN,
  simulateDelay,
  validateUsn,
  type RegisteredUser,
} from "@/lib/mock-auth";

interface UserLoginFormProps {
  initialValues?: { usn?: string; contact?: string };
  onOtpRequired: (usn: string, contact: string) => RegisteredUser | null;
  onSwitchToRegister: () => void;
}

export function UserLoginForm({ initialValues, onOtpRequired, onSwitchToRegister }: UserLoginFormProps) {
  const [usn, setUsn] = useState(initialValues?.usn ?? "");
  const [contact, setContact] = useState(initialValues?.contact ?? "");
  const [errors, setErrors] = useState<{ usn?: string; contact?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedContact = contact.trim();
    const isEmail = EMAIL_PATTERN.test(normalizedContact);
    const isMobile = MOBILE_PATTERN.test(normalizedContact.replace(/\s+/g, ""));
    const nextErrors: typeof errors = {
      usn: validateUsn(usn) ?? undefined,
      contact: !normalizedContact
        ? "Enter your registered mobile number or email."
        : !isEmail && !isMobile
          ? "Enter a valid email address or 10-digit mobile number."
          : undefined,
    };
    if (nextErrors.usn || nextErrors.contact) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    await simulateDelay(550);
    const user = onOtpRequired(usn.trim().toUpperCase(), normalizedContact);
    if (!user) {
      setLoading(false);
      setErrors({
        form: "We couldn't find a registered account with these details. Check your details or create your account first.",
      });
      return;
    }
    toast.success("Details verified — enter your verification code.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="login-usn">USN</Label>
        <Input
          id="login-usn"
          value={usn}
          onChange={(e) => setUsn(e.target.value.toUpperCase())}
          placeholder="e.g. 1RV22CS001"
          autoComplete="off"
          className="h-11"
        />
        {errors.usn && <p className="text-xs font-medium text-destructive">{errors.usn}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-contact">Registered Mobile Number or Email</Label>
        <Input
          id="login-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="9876543210 or you@campus.edu"
          autoComplete="off"
          className="h-11"
        />
        {errors.contact && <p className="text-xs font-medium text-destructive">{errors.contact}</p>}
      </div>
      {errors.form && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
          {errors.form}{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold underline underline-offset-2"
          >
            Create your account
          </button>
        </div>
      )}
      <Button type="submit" className="h-11 w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Checking details…
          </>
        ) : (
          <>
            <LogIn /> Continue
          </>
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <KeyRound className="h-3 w-3" /> Passwordless — you'll sign in with a 6-digit code.
      </p>
    </form>
  );
}
