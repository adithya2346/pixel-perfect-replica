/**
 * Demo staff directory used by the admin issue-type panel.
 *
 * Each issue category has its own roster of workers, labelled "Appointed to work"
 * or "Ready to accept work". Appointments are stored locally so the two groups
 * survive a reload; a default appointment per category is seeded so both groups
 * are populated on first view.
 */

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
}

const ELECTRICAL_STAFF: StaffMember[] = [
  { id: "stf-elec-1", name: "Ramesh Kumar", role: "Electrician", phone: "9000000041" },
  { id: "stf-elec-2", name: "Suresh Babu", role: "Electrician", phone: "9000000042" },
  { id: "stf-elec-3", name: "Anita Rao", role: "Electrical Supervisor", phone: "9000000043" },
];

const PLUMBING_STAFF: StaffMember[] = [
  { id: "stf-plmb-1", name: "Mahesh Patil", role: "Plumber", phone: "9000000051" },
  { id: "stf-plmb-2", name: "Ganesh Yadav", role: "Plumber", phone: "9000000052" },
  { id: "stf-plmb-3", name: "Shalini Menon", role: "Plumbing Supervisor", phone: "9000000053" },
];

const FURNITURE_STAFF: StaffMember[] = [
  { id: "stf-furn-1", name: "Imran Sheikh", role: "Carpenter", phone: "9000000061" },
  { id: "stf-furn-2", name: "Deepak Nair", role: "Carpenter", phone: "9000000062" },
  { id: "stf-furn-3", name: "Kavita Joshi", role: "Furniture Supervisor", phone: "9000000063" },
];

const NETWORK_STAFF: StaffMember[] = [
  { id: "stf-net-1", name: "Vikram Menon", role: "Network Engineer", phone: "9000000071" },
  { id: "stf-net-2", name: "Sneha Kulkarni", role: "IT Support", phone: "9000000072" },
  { id: "stf-net-3", name: "Rahul Desai", role: "Network Technician", phone: "9000000073" },
];

const GENERAL_STAFF: StaffMember[] = [
  { id: "stf-gen-1", name: "Santosh Reddy", role: "Maintenance Technician", phone: "9000000081" },
  { id: "stf-gen-2", name: "Farhan Ali", role: "Maintenance Technician", phone: "9000000082" },
  { id: "stf-gen-3", name: "Priya Shetty", role: "Facilities Supervisor", phone: "9000000083" },
];

/** Keyword matchers are ordered: specific trades first, IT/network last. */
const CATEGORIES: { keywords: string[]; staff: StaffMember[] }[] = [
  {
    keywords: ["electric", "power", "light", "fan", "switch", "mcb", "socket"],
    staff: ELECTRICAL_STAFF,
  },
  { keywords: ["plumb", "water", "leak", "drain", "tap", "pipe", "flush"], staff: PLUMBING_STAFF },
  {
    keywords: ["furniture", "carpent", "chair", "table", "bench", "board", "podium"],
    staff: FURNITURE_STAFF,
  },
  {
    keywords: ["network", "wifi", "wi-fi", "internet", "lan", "projector", "display"],
    staff: NETWORK_STAFF,
  },
  { keywords: ["computer", "system", "software", "hardware", "server"], staff: NETWORK_STAFF },
];

const LOCAL_APPOINTMENTS_KEY = "campusos-fixit:staff_assignments";

/** issueTypeId → { staffId → ticketId | null }. The ticket, when linked, supplies the deadline. */
type AppointmentMap = Record<string, Record<string, string | null>>;

function readAppointments(): AppointmentMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_APPOINTMENTS_KEY);
    return raw ? (JSON.parse(raw) as AppointmentMap) : {};
  } catch {
    return {};
  }
}

function writeAppointments(map: AppointmentMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(map));
  } catch {
    // Storage quota or disabled
  }
}

/** Staff roster for a category, matched on the category name and id. */
export function getStaffForIssueType(issueTypeId: string, issueTypeName: string): StaffMember[] {
  const haystack = `${issueTypeName} ${issueTypeId}`.toLowerCase();
  const match = CATEGORIES.find((category) =>
    category.keywords.some((keyword) => haystack.includes(keyword)),
  );
  return (match ?? { staff: GENERAL_STAFF }).staff;
}

/** Ids of staff holding an assignment on the given category. */
export function getAppointedStaffIds(issueTypeId: string): string[] {
  return Object.keys(readAppointments()[issueTypeId] ?? {});
}

/** Ticket a staff member is currently appointed to, if any. */
export function getAssignedTicketId(issueTypeId: string, staffId: string): string | null {
  return readAppointments()[issueTypeId]?.[staffId] ?? null;
}

export function appointStaff(issueTypeId: string, staffId: string, ticketId: string | null): void {
  const stored = readAppointments();
  const forCategory = stored[issueTypeId] ?? {};
  writeAppointments({ ...stored, [issueTypeId]: { ...forCategory, [staffId]: ticketId } });
}

export function releaseStaff(issueTypeId: string, staffId: string): void {
  const stored = readAppointments();
  const forCategory = { ...(stored[issueTypeId] ?? {}) };
  delete forCategory[staffId];
  writeAppointments({ ...stored, [issueTypeId]: forCategory });
}
