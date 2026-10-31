/**
 * CampusOS FixIt — Local Mock Store & Backend Sync
 * Synchronizes with live backend: https://campus-os-backend-8sjf.onrender.com
 * Implements the full lifecycle of maintenance tickets and issue types
 * according to the FixIt API specs (/api/v1/fixit) and wireframes.
 */

import { apiRequest } from "./api-client";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ACKNOWLEDGED";

export interface IssueType {
  id: string;
  name: string;
  description: string;
  icon?: string | undefined;
}

export interface Ticket {
  id: string; // e.g. TK-1024
  title: string;
  description: string;
  issue_type_id: string;
  issue_type_name: string;
  location: string;
  status: TicketStatus;
  photo_url?: string | undefined;
  created_by: string; // USN or email
  created_by_name: string;
  created_by_role: "student" | "faculty" | "office_staff" | "admin";
  created_at: string;
  expected_by?: string | undefined; // TAT ISO date string
  resolution_note?: string | undefined;
  resolved_at?: string | undefined;
  acknowledged_at?: string | undefined;
  assigned_to?: string | undefined;
  assigned_to_name?: string | undefined;
  assigned_to_role?: "office_staff" | "faculty" | string | undefined;
  assigned_by?: string | undefined;
  assigned_at?: string | undefined;
}

/** Shape of an issue-type item returned by the FixIt backend (fields may vary). */
interface BackendIssueType {
  issue_type_id?: string;
  id?: string;
  name?: string;
  description?: string;
  icon?: string;
}

/** Shape of a ticket item returned by the FixIt backend (fields may vary). */
interface BackendTicket {
  ticket_id?: string;
  id?: string;
  title?: string;
  description?: string;
  issue_type_id?: string;
  issue_type_name?: string;
  location?: string;
  status?: string;
  photo_url?: string;
  photo?: { url?: string };
  reported_by?: string;
  created_by?: string;
  reported_by_name?: string;
  created_by_name?: string;
  reported_by_role?: "student" | "faculty" | "admin";
  created_at?: string;
  expected_by?: string;
  resolution_note?: string;
  resolved_at?: string;
  acknowledged_at?: string;
}

const STORAGE_TICKETS_KEY = "campusos-fixit:tickets";
const STORAGE_ISSUE_TYPES_KEY = "campusos-fixit:issue_types";
const STORAGE_SEEDED_KEY = "campusos-fixit:demo_seeded";

export const DEFAULT_ISSUE_TYPES: IssueType[] = [
  {
    id: "it-electrical",
    name: "Electrical",
    description: "Fan, light, switch, MCB, sockets",
    icon: "Zap",
  },
  {
    id: "it-plumbing",
    name: "Plumbing",
    description: "Tap, pipe, leakage, flush, drainage",
    icon: "Droplets",
  },
  {
    id: "it-furniture",
    name: "Furniture",
    description: "Chair, table, bench, whiteboard, podium",
    icon: "Armchair",
  },
  {
    id: "it-itnetwork",
    name: "IT & Network",
    description: "WiFi, projector, LAN port, display",
    icon: "Wifi",
  },
];

/** ISO timestamp offset from now, so the demo dataset never goes stale. */
function daysFromNow(offset: number): string {
  return new Date(Date.now() + offset * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Demo tickets covering every issue category, all reported by Adithya. Loaded
 * once on first run so each category has data to show; an empty list afterwards
 * is respected.
 */
export const DEFAULT_TICKETS: Ticket[] = [
  // ── Electrical ──────────────────────────────────────────────────────────
  {
    id: "TK-1001",
    title: "Ceiling fan not working",
    description: "The ceiling fan in Room 204 does not spin at any speed. Makes a humming noise.",
    issue_type_id: "it-electrical",
    issue_type_name: "Electrical",
    location: "Academic Block A · Room 204",
    status: "OPEN",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-3),
    expected_by: daysFromNow(2),
    assigned_to: "STF-2024-41",
    assigned_to_name: "Ravi Shetty",
    assigned_to_role: "office_staff",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-2),
  },
  {
    id: "TK-1002",
    title: "Corridor tube light flickering",
    description: "Both tube lights in the first floor corridor flicker constantly.",
    issue_type_id: "it-electrical",
    issue_type_name: "Electrical",
    location: "Academic Block A · 1st Floor Corridor",
    status: "IN_PROGRESS",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-2),
    expected_by: daysFromNow(1),
    assigned_to: "STF-2024-41",
    assigned_to_name: "Ravi Shetty",
    assigned_to_role: "office_staff",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-2),
  },
  {
    id: "TK-1003",
    title: "Switch board sparking near Lab 3",
    description: "The switch board outside Lab 3 sparks when a plug is inserted. Safety risk.",
    issue_type_id: "it-electrical",
    issue_type_name: "Electrical",
    location: "Engineering Block · Lab 3",
    status: "OPEN",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-4),
    expected_by: daysFromNow(-1),
    assigned_to: "stf-elec-1",
    assigned_to_name: "Ramesh Kumar",
    assigned_to_role: "office_staff",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-3),
  },

  // ── Plumbing ────────────────────────────────────────────────────────────
  {
    id: "TK-1004",
    title: "Water leakage under wash basin",
    description: "Continuous drip from the pipe joint under the wash basin, floor stays wet.",
    issue_type_id: "it-plumbing",
    issue_type_name: "Plumbing",
    location: "Hostel Block B · Washroom 2",
    status: "IN_PROGRESS",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-2),
    expected_by: daysFromNow(1),
    assigned_to: "STF-2024-41",
    assigned_to_name: "Ravi Shetty",
    assigned_to_role: "office_staff",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-1),
  },
  {
    id: "TK-1005",
    title: "Drinking water tap broken",
    description: "The tap handle at the water station snapped off; water keeps running.",
    issue_type_id: "it-plumbing",
    issue_type_name: "Plumbing",
    location: "Canteen · Water Station",
    status: "OPEN",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-1),
    expected_by: daysFromNow(3),
    assigned_to: "STF-2024-41",
    assigned_to_name: "Ravi Shetty",
    assigned_to_role: "office_staff",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-1),
  },
  {
    id: "TK-1006",
    title: "Toilet flush not working",
    description: "Flush valve in the ground floor restroom does not release water.",
    issue_type_id: "it-plumbing",
    issue_type_name: "Plumbing",
    location: "Academic Block C · Ground Floor Restroom",
    status: "RESOLVED",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-6),
    expected_by: daysFromNow(-2),
    resolution_note: "Replaced the flush valve assembly and tested. Working normally.",
    resolved_at: daysFromNow(-3),
    assigned_to: "stf-plmb-1",
    assigned_to_name: "Mahesh Patil",
    assigned_to_role: "office_staff",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-5),
  },

  // ── Furniture ───────────────────────────────────────────────────────────
  {
    id: "TK-1007",
    title: "Broken chair in classroom",
    description: "One chair in Room 108 has a cracked leg and wobbles badly.",
    issue_type_id: "it-furniture",
    issue_type_name: "Furniture",
    location: "Academic Block B · Room 108",
    status: "OPEN",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-2),
    expected_by: daysFromNow(2),
  },
  {
    id: "TK-1008",
    title: "Whiteboard mounting loose",
    description: "The whiteboard in Room 110 has come off its top-left mounting screw.",
    issue_type_id: "it-furniture",
    issue_type_name: "Furniture",
    location: "Academic Block B · Room 110",
    status: "IN_PROGRESS",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-1),
    expected_by: daysFromNow(1),
    assigned_to: "1RV18CS042",
    assigned_to_name: "Dr. Priya Raman",
    assigned_to_role: "faculty",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-1),
  },
  {
    id: "TK-1009",
    title: "Podium table damaged",
    description: "The seminar hall podium table has a shattered corner and is unsafe to use.",
    issue_type_id: "it-furniture",
    issue_type_name: "Furniture",
    location: "Main Seminar Hall",
    status: "RESOLVED",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-7),
    expected_by: daysFromNow(-3),
    resolution_note: "Replaced the podium with a spare unit from the store room.",
    resolved_at: daysFromNow(-4),
  },

  // ── IT & Network ────────────────────────────────────────────────────────
  {
    id: "TK-1010",
    title: "WiFi not connecting in Library",
    description: "Campus WiFi keeps failing to authenticate on the library's second floor.",
    issue_type_id: "it-itnetwork",
    issue_type_name: "IT & Network",
    location: "Central Library · 2nd Floor",
    status: "OPEN",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-1),
    expected_by: daysFromNow(1),
    assigned_to: "1RV18CS042",
    assigned_to_name: "Dr. Priya Raman",
    assigned_to_role: "faculty",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-1),
  },
  {
    id: "TK-1011",
    title: "Projector not displaying",
    description: "The projector in Room 301 powers on but shows no signal on any input.",
    issue_type_id: "it-itnetwork",
    issue_type_name: "IT & Network",
    location: "Academic Block A · Room 301",
    status: "IN_PROGRESS",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-5),
    expected_by: daysFromNow(-1),
    assigned_to: "1RV18CS042",
    assigned_to_name: "Dr. Priya Raman",
    assigned_to_role: "faculty",
    assigned_by: "Team 41 Admin",
    assigned_at: daysFromNow(-4),
  },
  {
    id: "TK-1012",
    title: "LAN port dead at desk 12",
    description: "No link light and no connectivity from the LAN port at Computer Lab 2, desk 12.",
    issue_type_id: "it-itnetwork",
    issue_type_name: "IT & Network",
    location: "Computer Lab 2",
    status: "OPEN",
    created_by: "Adithya",
    created_by_name: "Adithya",
    created_by_role: "student",
    created_at: daysFromNow(-1),
    expected_by: daysFromNow(3),
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota or disabled
  }
}

export function isTicketOverdue(ticket: Ticket): boolean {
  if (ticket.status === "RESOLVED" || ticket.status === "ACKNOWLEDGED") {
    return false;
  }
  if (!ticket.expected_by) return false;
  return new Date(ticket.expected_by).getTime() < Date.now();
}

export function getIssueTypes(): IssueType[] {
  const existing = readJson<IssueType[] | null>(STORAGE_ISSUE_TYPES_KEY, null);
  if (existing === null) {
    writeJson(STORAGE_ISSUE_TYPES_KEY, DEFAULT_ISSUE_TYPES);
    return DEFAULT_ISSUE_TYPES;
  }
  return existing;
}

export function saveIssueTypes(types: IssueType[]): void {
  writeJson(STORAGE_ISSUE_TYPES_KEY, types);
}

export async function syncIssueTypesFromBackend(): Promise<IssueType[]> {
  try {
    const res = await apiRequest<{ items: BackendIssueType[]; count: number }>(
      "/fixit/issue-types",
    );
    if (res && Array.isArray(res.items) && res.items.length > 0) {
      const mapped: IssueType[] = res.items.map((item) => ({
        id: item.issue_type_id || item.id || `it-${Date.now().toString(36)}`,
        name: item.name || "General",
        description: item.description || "",
        icon: item.icon || "Wrench",
      }));
      saveIssueTypes(mapped);
      return mapped;
    }
  } catch {
    // Offline fallback
  }
  return getIssueTypes();
}

export function addIssueType(data: {
  name: string;
  description: string;
  icon?: string;
}): IssueType {
  const types = getIssueTypes();
  const newType: IssueType = {
    id: `it-${Date.now().toString(36)}`,
    name: data.name.trim(),
    description: data.description.trim(),
    icon: data.icon || "Wrench",
  };
  saveIssueTypes([...types, newType]);

  // Attempt backend push asynchronously
  apiRequest("/fixit/issue-types", {
    method: "POST",
    json: { name: newType.name, description: newType.description },
  }).catch(() => {});

  return newType;
}

export function updateIssueType(id: string, data: Partial<IssueType>): IssueType | null {
  const types = getIssueTypes();
  const idx = types.findIndex((t) => t.id === id);
  const existing = types[idx];
  if (idx === -1 || !existing) return null;

  const updatedType: IssueType = {
    id: existing.id,
    name: data.name ?? existing.name,
    description: data.description ?? existing.description,
    icon: data.icon ?? existing.icon,
  };
  types[idx] = updatedType;
  saveIssueTypes(types);

  apiRequest(`/fixit/issue-types/${id}`, {
    method: "PATCH",
    json: { name: data.name, description: data.description },
  }).catch(() => {});

  return updatedType;
}

export function deleteIssueType(id: string): boolean {
  const types = getIssueTypes();
  const filtered = types.filter((t) => t.id !== id);
  if (filtered.length === types.length) return false;
  saveIssueTypes(filtered);

  apiRequest(`/fixit/issue-types/${id}`, { method: "DELETE" }).catch(() => {});
  return true;
}

/** Bump this to merge a new batch of demo tickets into existing browsers. */
const DEMO_SEED_VERSION = 3;

export function getTickets(): Ticket[] {
  const stored = readJson<Ticket[] | null>(STORAGE_TICKETS_KEY, null);
  const version = readJson<number>(STORAGE_SEEDED_KEY, 0);

  if (stored === null) {
    writeJson(STORAGE_SEEDED_KEY, DEMO_SEED_VERSION);
    writeJson(STORAGE_TICKETS_KEY, DEFAULT_TICKETS);
    return DEFAULT_TICKETS;
  }

  if (version < DEMO_SEED_VERSION) {
    // Add any demo ticket the store does not already have, and backfill assignments
    const defaultById = new Map(DEFAULT_TICKETS.map((t) => [t.id, t]));
    const updated = stored.map((ticket) => {
      const def = defaultById.get(ticket.id);
      if (def && !ticket.assigned_to && def.assigned_to) {
        return {
          ...ticket,
          assigned_to: def.assigned_to,
          assigned_to_name: def.assigned_to_name,
          assigned_to_role: def.assigned_to_role,
          assigned_by: def.assigned_by,
          assigned_at: def.assigned_at,
        };
      }
      return ticket;
    });

    const existingIds = new Set(updated.map((ticket) => ticket.id));
    const merged = [...updated, ...DEFAULT_TICKETS.filter((ticket) => !existingIds.has(ticket.id))];
    writeJson(STORAGE_SEEDED_KEY, DEMO_SEED_VERSION);
    writeJson(STORAGE_TICKETS_KEY, merged);
    return merged;
  }

  return stored;
}

export function saveTickets(tickets: Ticket[]): void {
  writeJson(STORAGE_TICKETS_KEY, tickets);
}

export async function syncTicketsFromBackend(): Promise<Ticket[]> {
  try {
    const res = await apiRequest<{ items: BackendTicket[]; count: number }>("/fixit/tickets");
    if (res && Array.isArray(res.items) && res.items.length > 0) {
      const localById = new Map(getTickets().map((ticket) => [ticket.id, ticket]));
      const mapped: Ticket[] = res.items.map((item) => {
        const id = item.ticket_id || item.id || `TK-${Date.now().toString(36)}`;
        const backendStatus = (item.status || "OPEN").toUpperCase() as TicketStatus;
        const local = localById.get(id);
        // The API only models "open" and "resolved", so an in-progress or
        // acknowledged state we are tracking locally must survive the sync.
        const keepLocalStatus =
          backendStatus === "OPEN" &&
          (local?.status === "IN_PROGRESS" || local?.status === "ACKNOWLEDGED");

        return {
          id,
          title: item.title || "Untitled issue",
          description: item.description || "",
          issue_type_id: item.issue_type_id || "general",
          issue_type_name: item.issue_type_name || "General",
          location: item.location || "Campus",
          status: keepLocalStatus && local ? local.status : backendStatus,
          photo_url: item.photo_url || item.photo?.url,
          created_by: item.reported_by || item.created_by || "user",
          created_by_name: item.reported_by_name || item.created_by_name || "Campus Member",
          created_by_role: item.reported_by_role || "student",
          created_at: item.created_at || new Date().toISOString(),
          expected_by: item.expected_by ?? local?.expected_by,
          resolution_note: item.resolution_note ?? local?.resolution_note,
          resolved_at: item.resolved_at ?? local?.resolved_at,
          acknowledged_at: item.acknowledged_at ?? local?.acknowledged_at,
          assigned_to: local?.assigned_to,
          assigned_to_name: local?.assigned_to_name,
          assigned_to_role: local?.assigned_to_role,
          assigned_by: local?.assigned_by,
          assigned_at: local?.assigned_at,
        };
      });

      saveTickets(mapped);
      return mapped;
    }
  } catch {
    // Offline fallback
  }
  return getTickets();
}

export function createTicket(payload: {
  title: string;
  description: string;
  issue_type_id: string;
  location: string;
  photo_url?: string | undefined;
  creatorName: string;
  creatorId: string;
  creatorRole: "student" | "faculty" | "office_staff" | "admin";
}): Ticket {
  const tickets = getTickets();
  const issueTypes = getIssueTypes();
  const issueType = issueTypes.find((it) => it.id === payload.issue_type_id);

  // Generate next sequential ticket ID
  const nextNumber = 1000 + tickets.length + 1;
  const newTicket: Ticket = {
    id: `TK-${nextNumber}`,
    title: payload.title.trim(),
    description: payload.description.trim(),
    issue_type_id: payload.issue_type_id,
    issue_type_name: issueType ? issueType.name : "General",
    location: payload.location.trim() || "Main Campus",
    status: "OPEN",
    photo_url: payload.photo_url,
    created_by: payload.creatorId,
    created_by_name: payload.creatorName,
    created_by_role: payload.creatorRole,
    created_at: new Date().toISOString(),
    expected_by: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  };

  saveTickets([newTicket, ...tickets]);

  // Attempt backend POST (form-data per API spec)
  const formData = new FormData();
  formData.append("issue_type_id", payload.issue_type_id);
  formData.append("title", payload.title);
  formData.append("description", payload.description);

  apiRequest("/fixit/tickets", {
    method: "POST",
    formData,
  }).catch(() => {});

  return newTicket;
}

export function updateTicket(
  id: string,
  payload: Partial<
    Pick<Ticket, "title" | "description" | "location" | "issue_type_id" | "photo_url">
  >,
): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  const current = tickets[idx];
  if (idx === -1 || !current) return null;

  let typeName = current.issue_type_name;
  if (payload.issue_type_id && payload.issue_type_id !== current.issue_type_id) {
    const it = getIssueTypes().find((item) => item.id === payload.issue_type_id);
    if (it) typeName = it.name;
  }

  const updatedTicket: Ticket = {
    ...current,
    ...payload,
    issue_type_name: typeName,
  };
  tickets[idx] = updatedTicket;
  saveTickets(tickets);

  // Backend patch
  apiRequest(`/fixit/tickets/${id}`, {
    method: "PATCH",
    json: payload,
  }).catch(() => {});

  return updatedTicket;
}

/** A ticket still needs work until it is RESOLVED or ACKNOWLEDGED. */
export function isActiveTicket(ticket: Ticket): boolean {
  return ticket.status === "OPEN" || ticket.status === "IN_PROGRESS";
}

/**
 * The API only models `open` and `resolved`, and it rejects an empty note, so a
 * status change without a comment still needs something to send.
 */
const STATUS_NOTES: Record<TicketStatus, string> = {
  OPEN: "Reopened — work is back in the queue.",
  IN_PROGRESS: "Work assigned — the maintenance team is on it.",
  RESOLVED: "Issue resolved.",
  ACKNOWLEDGED: "Ticket closed by the reporter.",
};

export function updateTicketStatus(
  id: string,
  newStatus: TicketStatus,
  resolutionNote?: string,
  expectedBy?: string,
): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  const current = tickets[idx];
  if (idx === -1 || !current) return null;

  const updated: Ticket = {
    ...current,
    status: newStatus,
    resolution_note: resolutionNote !== undefined ? resolutionNote : current.resolution_note,
    expected_by: expectedBy !== undefined ? expectedBy : current.expected_by,
  };

  if (newStatus === "RESOLVED" && !current.resolved_at) {
    updated.resolved_at = new Date().toISOString();
  }

  tickets[idx] = updated;
  saveTickets(tickets);

  // Call backend status & tat endpoints. The API accepts only `open`/`resolved`,
  // and StatusSet requires a note of 1-280 characters, so never send "".
  const apiStatus = newStatus === "RESOLVED" ? "resolved" : "open";
  const note = (resolutionNote?.trim() || STATUS_NOTES[newStatus]).slice(0, 280);
  apiRequest(`/fixit/tickets/${id}/status`, {
    method: "PUT",
    json: { status: apiStatus, note },
  }).catch(() => {});

  if (expectedBy) {
    const dateOnly = expectedBy.split("T")[0];
    apiRequest(`/fixit/tickets/${id}/tat`, {
      method: "PUT",
      json: { expected_by: dateOnly, note: resolutionNote?.trim() || null },
    }).catch(() => {});
  }

  return updated;
}

export function acknowledgeTicket(id: string): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  const current = tickets[idx];
  if (idx === -1 || !current) return null;

  const updated: Ticket = {
    ...current,
    status: "ACKNOWLEDGED",
    acknowledged_at: new Date().toISOString(),
  };
  tickets[idx] = updated;
  saveTickets(tickets);

  apiRequest(`/fixit/tickets/${id}/acknowledge`, {
    method: "POST",
  }).catch(() => {});

  return updated;
}

export function deleteTicket(id: string): boolean {
  const tickets = getTickets();
  const filtered = tickets.filter((t) => t.id !== id);
  if (filtered.length === tickets.length) return false;
  saveTickets(filtered);

  apiRequest(`/fixit/tickets/${id}`, {
    method: "DELETE",
  }).catch(() => {});

  return true;
}

export function isTicketCreatedByUser(
  ticket: Ticket,
  user?:
    | {
        id?: string | null;
        name?: string | null;
        role?: string | null;
        usn?: string | null;
      }
    | null
    | string,
): boolean {
  if (!user) return false;
  const uid = (typeof user === "string" ? user : user.id || "").toLowerCase().trim();
  const usn = (typeof user === "string" ? "" : user.usn || "").toLowerCase().trim();
  const uname = (typeof user === "string" ? "" : user.name || "").toLowerCase().trim();
  const creatorId = (ticket.created_by || "").toLowerCase().trim();
  const creatorName = (ticket.created_by_name || "").toLowerCase().trim();

  if (uid && (creatorId === uid || creatorId.includes(uid))) return true;
  if (usn && (creatorId === usn || creatorId.includes(usn))) return true;
  if (uname && (creatorName === uname || creatorName.includes(uname) || uname.includes(creatorName))) return true;

  // Fallback for demo tickets created by "Adithya"
  if (
    (creatorId === "adithya" || creatorName.includes("adithya")) &&
    (uname.includes("aarav") || uname.includes("adithya") || !uname || typeof user === "string")
  ) {
    return true;
  }

  return false;
}

export function computeFixItStats(
  tickets: Ticket[],
  user?:
    | {
        id?: string | null;
        name?: string | null;
        role?: string | null;
        usn?: string | null;
      }
    | null
    | string,
) {
  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolved = tickets.filter(
    (t) => t.status === "RESOLVED" || t.status === "ACKNOWLEDGED",
  ).length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const overdue = tickets.filter(isTicketOverdue).length;
  const myTickets = user
    ? tickets.filter((t) => isTicketCreatedByUser(t, user)).length
    : tickets.length;

  return { total, open, resolved, inProgress, overdue, myTickets };
}

export function assignTicketToStaff(
  id: string,
  assignee: {
    id: string;
    name: string;
    role: string;
    assignedBy?: string;
  },
): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  const current = tickets[idx];
  if (idx === -1 || !current) return null;

  const updated: Ticket = {
    ...current,
    assigned_to: assignee.id,
    assigned_to_name: assignee.name,
    assigned_to_role: assignee.role,
    assigned_by: assignee.assignedBy || "Campus Admin",
    assigned_at: new Date().toISOString(),
    status: current.status === "OPEN" ? "IN_PROGRESS" : current.status,
  };

  tickets[idx] = updated;
  saveTickets(tickets);
  return updated;
}

export function unassignTicket(id: string): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  const current = tickets[idx];
  if (idx === -1 || !current) return null;

  const updated: Ticket = {
    ...current,
    assigned_to: undefined,
    assigned_to_name: undefined,
    assigned_to_role: undefined,
    assigned_by: undefined,
    assigned_at: undefined,
  };

  tickets[idx] = updated;
  saveTickets(tickets);
  return updated;
}

export function isTicketAssignedToUser(
  ticket: Ticket,
  user?: {
    id?: string | null;
    name?: string | null;
    role?: string | null;
    usn?: string | null;
  } | null,
): boolean {
  if (!user) return false;
  const uid = (user.id || "").toLowerCase().trim();
  const usn = (user.usn || "").toLowerCase().trim();
  const uname = (user.name || "").toLowerCase().trim();
  const urole = (user.role || "").toLowerCase().trim();

  // 1. Direct match on assigned_to ID/USN
  if (ticket.assigned_to) {
    const assignedTo = ticket.assigned_to.toLowerCase().trim();
    if (
      (uid && (assignedTo === uid || assignedTo.includes(uid))) ||
      (usn && (assignedTo === usn || assignedTo.includes(usn)))
    ) {
      return true;
    }
  }

  // 2. Direct match on assigned_to_name
  if (ticket.assigned_to_name && uname) {
    const assignedName = ticket.assigned_to_name.toLowerCase().trim();
    if (
      assignedName === uname ||
      assignedName.includes(uname) ||
      uname.includes(assignedName)
    ) {
      return true;
    }
  }

  // 3. Trade / role match for logged-in staff and faculty
  if (urole === "office_staff" && ticket.assigned_to_role === "office_staff") {
    // If assigned to staff without a person or to demo staff
    if (
      !ticket.assigned_to ||
      ticket.assigned_to === "STF-2024-41" ||
      uname.includes("ravi") ||
      uname.includes("staff")
    ) {
      return true;
    }
  }

  if (urole === "faculty" && ticket.assigned_to_role === "faculty") {
    // If assigned to faculty without a person or to demo faculty
    if (
      !ticket.assigned_to ||
      ticket.assigned_to === "1RV18CS042" ||
      uname.includes("priya") ||
      uname.includes("faculty")
    ) {
      return true;
    }
  }

  return false;
}

export function computeAssignedStats(
  tickets: Ticket[],
  user?: {
    id?: string | null;
    name?: string | null;
    role?: string | null;
    usn?: string | null;
  } | null,
) {
  const assigned = tickets.filter((t) => isTicketAssignedToUser(t, user));
  const total = assigned.length;
  const inProgress = assigned.filter((t) => t.status === "IN_PROGRESS").length;
  const open = assigned.filter((t) => t.status === "OPEN").length;
  const resolved = assigned.filter(
    (t) => t.status === "RESOLVED" || t.status === "ACKNOWLEDGED",
  ).length;
  const overdue = assigned.filter(isTicketOverdue).length;

  return { total, inProgress, open, resolved, overdue, assignedTickets: assigned };
}
