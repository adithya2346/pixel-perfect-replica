import { CheckCircle2, Loader2 } from "lucide-react";

interface AuthSuccessProps {
  title: string;
  message: string;
}

export function AuthSuccess({ title, message }: AuthSuccessProps) {
  return (
    <div className="animate-in fade-in zoom-in-95 flex flex-col items-center py-10 text-center duration-300">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 shadow-[0_0_48px_-10px_var(--glow)]">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Taking you to your dashboard…
      </div>
    </div>
  );
}
