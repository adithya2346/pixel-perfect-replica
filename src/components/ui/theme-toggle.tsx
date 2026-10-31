import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  variant = "outline",
  size = "sm",
  showLabel = false,
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative transition-all duration-200 border-border bg-card/60 hover:bg-secondary/80 text-foreground",
        showLabel ? "gap-2 px-3 h-8 text-xs font-medium" : "h-8 w-8 p-0 rounded-xl",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-cyan-600 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs">{isDark ? "Light Mode" : "Dark Mode"}</span>
      )}
    </Button>
  );
}

export function ThemeSegmentedToggle({ className }: { className?: string }) {
  const { isDark, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-border bg-card/60 p-0.5 text-xs shadow-sm",
        className
      )}
      role="group"
      aria-label="Theme selection"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all",
          !isDark
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all",
          isDark
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        <span>Dark</span>
      </button>
    </div>
  );
}
