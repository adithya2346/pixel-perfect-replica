import { useState } from "react";
import { Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_DEMO,
  matchesAdminCredentials,
  simulateDelay,
  validateEmail,
  validateMobile,
} from "@/lib/mock-auth";

interface AdminLoginFormProps {
  onOtpRequired: (email: string) => void;
}

export function AdminLoginForm({ onOtpRequired }: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{
    email?: string | undefined;
    phone?: string | undefined;
    form?: string | undefined;
  }>({});
  const [loading, setLoading] = useState(false);

  function fillCredentials(adminEmail: string, adminPhone: string) {
    setEmail(adminEmail);
    setPhone(adminPhone);
    setErrors({});
    toast.info(`Filled credentials for ${adminEmail}`);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const emailError = validateEmail(email) ?? undefined;
    const phoneError = validateMobile(phone) ?? undefined;
    if (emailError || phoneError) {
      setErrors({ email: emailError, phone: phoneError });
      return;
    }
    setErrors({});
    setLoading(true);
    await simulateDelay(400);

    if (!matchesAdminCredentials(email, phone)) {
      setLoading(false);
      setErrors({ form: "Please enter a valid administrator email and phone number." });
      toast.error("Invalid administrator format.");
      return;
    }

    onOtpRequired(email.trim());
    toast.success("Administrator recognized. Enter your OTP code.");
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Restricted area · Authenticates with live FastAPI backend on Render.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-destructive">
            <ShieldCheck className="h-3.5 w-3.5" /> Team 41 Admin
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">FixIt Maintenance</span>
        </div>
        <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-foreground">
          Team 41 Administrator Portal
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Secure access to CampusOS FixIt management dashboard.
        </p>
      </div>

      {/* Quick pre-fill helper buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fillCredentials(ADMIN_DEMO.email, ADMIN_DEMO.phone)}
          className="h-8 border-destructive/30 bg-destructive/5 text-xs text-foreground hover:bg-destructive/10"
        >
          <Sparkles className="mr-1.5 h-3 w-3 text-destructive" /> Fill Team 41 Admin
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="admin-email">Admin Email Address</Label>
          <Input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            autoComplete="off"
            className="h-11"
          />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-phone">Admin Phone Number</Label>
          <Input
            id="admin-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter admin phone number"
            autoComplete="off"
            className="h-11"
          />
          {errors.phone && <p className="text-xs font-medium text-destructive">{errors.phone}</p>}
        </div>
        {errors.form && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">
            {errors.form}
          </div>
        )}
        <Button type="submit" variant="destructive" className="h-11 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Verifying credentials…
            </>
          ) : (
            "Continue to verification"
          )}
        </Button>
      </form>
    </div>
  );
}
