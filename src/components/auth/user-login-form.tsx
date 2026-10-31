import { useEffect, useState } from "react";
import { KeyRound, Loader2, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLatestRegisteredUser, simulateDelay, type RegisteredUser } from "@/lib/mock-auth";

interface UserLoginFormProps {
  initialValues?: { usn?: string; contact?: string };
  onOtpRequired: (usn: string, contact: string) => RegisteredUser | null;
  onSwitchToRegister?: () => void;
}

export function UserLoginForm({
  initialValues,
  onOtpRequired,
  onSwitchToRegister,
}: UserLoginFormProps) {
  const [usn, setUsn] = useState(initialValues?.usn ?? "");
  const [contact, setContact] = useState(initialValues?.contact ?? "");
  const [latestUser, setLatestUser] = useState<RegisteredUser | null>(null);
  const [errors, setErrors] = useState<{
    usn?: string | undefined;
    contact?: string | undefined;
    form?: string | undefined;
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const latest = getLatestRegisteredUser();
    if (latest) {
      setLatestUser(latest);
    }
  }, []);

  function handleFill(userUsn: string, userContact: string) {
    setUsn(userUsn);
    setContact(userContact);
    setErrors({});
    toast.info(`Filled credentials for ${userUsn}`);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanUsn = usn.trim();
    const cleanContact = contact.trim();

    if (!cleanUsn && !cleanContact) {
      setErrors({ form: "Please enter your USN, email, or registered phone number." });
      return;
    }

    if (!cleanUsn) {
      setErrors({ usn: "Enter your USN or registered identifier." });
      return;
    }

    if (!cleanContact) {
      setErrors({ contact: "Enter your registered email address or mobile number." });
      return;
    }

    setErrors({});
    setLoading(true);
    await simulateDelay(400);

    const user = onOtpRequired(cleanUsn, cleanContact);
    if (!user) {
      setLoading(false);
      setErrors({
        form: "We couldn't find an account matching these details. Please check your credentials or create an account first.",
      });
      return;
    }

    toast.success("Account recognized — enter your 6-digit code.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Quick helper buttons for convenience */}
      <div className="flex flex-wrap gap-2">
        {latestUser && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFill(latestUser.usn, latestUser.email || latestUser.mobile)}
            className="h-8 border-primary/40 bg-primary/10 text-xs text-primary hover:bg-primary/20"
          >
            <UserCheck className="mr-1.5 h-3 w-3" />
            Fill My Account ({latestUser.fullName.split(" ")[0]})
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleFill("1RV23CS099", "aarav.student@campus.edu")}
          className="h-8 border-border bg-secondary/40 text-xs text-muted-foreground hover:bg-secondary/70"
        >
          <Sparkles className="mr-1.5 h-3 w-3 text-cyan-400" />
          Demo Student
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleFill("1RV18CS042", "priya.faculty@campus.edu")}
          className="h-8 border-border bg-secondary/40 text-xs text-muted-foreground hover:bg-secondary/70"
        >
          Demo Faculty
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-usn">USN (University Seat Number)</Label>
        <Input
          id="login-usn"
          value={usn}
          onChange={(e) => setUsn(e.target.value.toUpperCase())}
          placeholder="e.g. 1RV22CS001"
          autoComplete="username"
          className="h-11 font-mono uppercase"
        />
        {errors.usn && <p className="text-xs font-medium text-destructive">{errors.usn}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-contact">Registered Mobile Number or Email</Label>
        <Input
          id="login-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="e.g. student@campus.edu or 9876543210"
          autoComplete="email"
          className="h-11"
        />
        {errors.contact && <p className="text-xs font-medium text-destructive">{errors.contact}</p>}
      </div>

      {errors.form && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
          {errors.form}
          {onSwitchToRegister && (
            <>
              {" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold underline underline-offset-2 hover:opacity-90"
              >
                Register now
              </button>
            </>
          )}
        </div>
      )}

      <Button type="submit" className="h-11 w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" /> Verifying account…
          </>
        ) : (
          <>
            <KeyRound className="mr-2 h-4 w-4" /> Continue to verification
          </>
        )}
      </Button>
    </form>
  );
}
