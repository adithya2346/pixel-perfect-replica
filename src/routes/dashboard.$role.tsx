import { createFileRoute, redirect } from "@tanstack/react-router";

import {
  DashboardPlaceholder,
  DASHBOARD_ROLES,
  type DashboardRole,
} from "@/components/auth/dashboard-placeholder";

export const Route = createFileRoute("/dashboard/$role")({
  beforeLoad: ({ params }) => {
    if (!DASHBOARD_ROLES.includes(params.role as DashboardRole)) {
      throw redirect({ to: "/" });
    }
  },
  component: DashboardRoute,
  head: () => ({
    meta: [
      { title: "Dashboard · CampusOS – FixIt" },
      {
        name: "description",
        content: "Your CampusOS – FixIt dashboard — report, track and resolve campus issues.",
      },
      { property: "og:title", content: "Dashboard · CampusOS – FixIt" },
      {
        property: "og:description",
        content: "Your CampusOS – FixIt dashboard — report, track and resolve campus issues.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function DashboardRoute() {
  const { role } = Route.useParams();
  return <DashboardPlaceholder role={role as DashboardRole} />;
}
