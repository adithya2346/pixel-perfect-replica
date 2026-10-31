import { useEffect, useState } from "react";
import { ArrowLeft, Info, KeyRound, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const RESEND_SECONDS = 30;

interface OTPVerificationProps {
  title: string;
  subtitle: string;
  expectedCode?: string | undefined;
  onVerified: (code: string) => Promise<boolean | string | void> | boolean | string | void;
  onResend: () => void;
  onBack: () => void;
  backLabel: string;
  editDetails?: { label: string; onClick: () => void } | undefined;
}

export function OTPVerification({
  title,
  subtitle,
  expectedCode,
  onVerified,
  onResend,
  onBack,
  backLabel,
  editDetails,
}: OTPVerificationProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function verify(value: string) {
    if (verifying || value.length !== 6) return;
    setVerifying(true);
    setError(null);

    try {
      const result = await onVerified(value);
      if (typeof result === "string") {
        setVerifying(false);
        setError(result);
        return;
      }
      if (result === false) {
        setVerifying(false);
        setError("Incorrect verification code. Please check and try again.");
        return;
      }
      // Success, parent will transition screen
    } catch (err: unknown) {
      setVerifying(false);
      setError((err as Error)?.message || "Verification failed. Please try again.");
    }
  }

  function handleResend() {
    onResend();
    setCode("");
    setError(null);
    setSecondsLeft(RESEND_SECONDS);
  }

  const canVerify = code.length === 6 && !verifying;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </button>

      <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
        <KeyRound className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

      {expectedCode && (
        <div className="mt-4 flex items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-2.5">
          <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Your verification code</span>
          <span className="font-display text-sm font-bold tracking-[0.25em] text-primary">
            {expectedCode}
          </span>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          onComplete={(v) => verify(v)}
          disabled={verifying}
          containerClassName="justify-center"
        >
          <InputOTPGroup className="gap-2.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="h-12 w-10 rounded-xl border bg-secondary/60 font-display text-lg text-foreground first:rounded-xl last:rounded-xl sm:w-11"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <p className="mt-3 text-center text-xs font-medium text-destructive">{error}</p>}

      <Button
        type="button"
        className="mt-6 h-11 w-full"
        disabled={!canVerify}
        onClick={() => verify(code)}
      >
        {verifying ? (
          <>
            <Loader2 className="animate-spin" /> Verifying…
          </>
        ) : (
          "Verify & continue"
        )}
      </Button>

      <div className="mt-4 flex items-center justify-center gap-5 text-xs">
        {secondsLeft > 0 ? (
          <span className="text-muted-foreground">
            Resend code in 0:{String(secondsLeft).padStart(2, "0")}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center gap-1.5 font-medium text-primary transition-opacity hover:opacity-80"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Resend code
          </button>
        )}
        {editDetails && (
          <button
            type="button"
            onClick={editDetails.onClick}
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {editDetails.label}
          </button>
        )}
      </div>
    </div>
  );
}
