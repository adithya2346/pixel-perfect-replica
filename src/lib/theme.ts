import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "campusos-fixit:theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "dark"; // Default to dark navy SaaS theme
  } catch {
    return "dark";
  }
}

export function getResolvedTheme(theme: Theme = getStoredTheme()): "light" | "dark" {
  if (theme === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = getResolvedTheme(theme);
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage quota or disabled
  }

  window.dispatchEvent(new CustomEvent("campusos-theme-change", { detail: theme }));
}

export function useTheme() {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setMounted(true);
    const initial = getStoredTheme();
    applyTheme(initial);
    setThemeState(initial);
    setResolvedTheme(getResolvedTheme(initial));

    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        const next = getStoredTheme();
        setThemeState(next);
        setResolvedTheme(getResolvedTheme(next));
      }
    }

    function handleCustom(e: Event) {
      const next = (e as CustomEvent<Theme>).detail || getStoredTheme();
      setThemeState(next);
      setResolvedTheme(getResolvedTheme(next));
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("campusos-theme-change", handleCustom);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMedia = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
        setResolvedTheme(getResolvedTheme("system"));
      }
    };
    mediaQuery.addEventListener("change", handleMedia);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("campusos-theme-change", handleCustom);
      mediaQuery.removeEventListener("change", handleMedia);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
    setThemeState(newTheme);
    setResolvedTheme(getResolvedTheme(newTheme));
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark",
    mounted,
  };
}

