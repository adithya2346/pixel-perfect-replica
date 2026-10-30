import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AuthTab = "login" | "register";

interface AuthTabsProps {
  value: AuthTab;
  onChange: (tab: AuthTab) => void;
}

export function AuthTabs({ value, onChange }: AuthTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as AuthTab)}>
      <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/70 p-1">
        <TabsTrigger value="login" className="rounded-lg font-medium">
          Sign in
        </TabsTrigger>
        <TabsTrigger value="register" className="rounded-lg font-medium">
          Register
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
