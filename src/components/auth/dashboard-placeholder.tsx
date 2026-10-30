import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { getSession, type AuthSession, type DashboardRole } from "@/lib/mock-auth";
import { FixItDashboard } from "@/components/fixit/fixit-dashboard";

export const DASHBOARD_ROLES: DashboardRole[] = ["student", "faculty", "admin"];

export function DashboardPlaceholder({ role }: { role: DashboardRole }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const existing = getSession();
    if (!existing) {
      toast.info("Please authenticate to view the FixIt dashboard.");
      navigate({ to: "/" });
      return;
    }
    setSession(existing);
    setChecked(true);
  }, [navigate]);

  if (!checked || !session) return null;

  return <FixItDashboard role={role} />;
}
