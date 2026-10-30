/**
 * CampusOS FixIt — Local Mock Store & State Management
 * Implements the full lifecycle of maintenance tickets and issue types
 * according to the FixIt API specs (/api/v1/fixit) and wireframes.
 */

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ACKNOWLEDGED";

export interface IssueType {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface Ticket {
  id: string; // e.g. TK-1024
  title: string;
  description: string;
  issue_type_id: string;
  issue_type_name: string;
  location: string;
  status: TicketStatus;
  photo_url?: string;
  created_by: string; // USN or email
  created_by_name: string;
  created_by_role: "student" | "faculty" | "admin";
  created_at: string;
  expected_by?: string; // TAT ISO date string
  resolution_note?: string;
  resolved_at?: string;
  acknowledged_at?: string;
}

const STORAGE_TICKETS_KEY = "campusos-fixit:tickets";
const STORAGE_ISSUE_TYPES_KEY = "campusos-fixit:issue_types";

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

export const DEFAULT_TICKETS: Ticket[] = [
  {
    id: "TK-1024",
    title: "Fan not working",
    description: "The ceiling fan in row 3 is vibrating heavily and not rotating at full speed.",
    issue_type_id: "it-electrical",
    issue_type_name: "Electrical",
    location: "Classroom 204, Block B",
    status: "OPEN",
    photo_url: "https://images.unsplash.com/photo-1594910069352-840801828f73?w=500&auto=format&fit=crop&q=60",
    created_by: "1RV23CS099",
    created_by_name: "Aarav Sharma",
    created_by_role: "student",
    created_at: "2026-10-12T09:30:00Z",
    expected_by: "2026-10-13T17:00:00Z",
  },
  {
    id: "TK-1018",
    title: "Water leakage",
    description: "Pipe under the third sink has a constant water leak causing a large puddle on the floor.",
    issue_type_id: "it-plumbing",
    issue_type_name: "Plumbing",
    location: "Ground Floor Washroom, Main Block",
    status: "IN_PROGRESS",
    photo_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60",
    created_by: "1RV18CS042",
    created_by_name: "Dr. Priya Raman",
    created_by_role: "faculty",
    created_at: "2026-10-10T14:15:00Z",
    expected_by: "2026-10-12T12:00:00Z", // Past date => OVERDUE
  },
  {
    id: "TK-1005",
    title: "Broken chair",
    description: "Armrest detached from chair #14, exposed metal bracket is hazardous.",
    issue_type_id: "it-furniture",
    issue_type_name: "Furniture",
    location: "Seminar Hall A",
    status: "RESOLVED",
    photo_url: "https://images.unsplash.com/photo-1503602642458-232111445657?w=500&auto=format&fit=crop&q=60",
    created_by: "1RV23CS099",
    created_by_name: "Aarav Sharma",
    created_by_role: "student",
    created_at: "2026-10-08T11:00:00Z",
    expected_by: "2026-10-09T18:00:00Z",
    resolved_at: "2026-10-09T16:20:00Z",
    resolution_note: "Fan/bracket welded and tightened with heavy duty bolts. Replaced cushion pad.",
  },
  {
    id: "TK-1002",
    title: "Projector HDMI signal failure",
    description: "Ceiling projector fails to handshake with laptop HDMI cords. Audio works but video cuts out.",
    issue_type_id: "it-itnetwork",
    issue_type_name: "IT & Network",
    location: "Lab 302, Tech Block",
    status: "ACKNOWLEDGED",
    created_by: "1RV18CS042",
    created_by_name: "Dr. Priya Raman",
    created_by_role: "faculty",
    created_at: "2026-10-05T08:45:00Z",
    expected_by: "2026-10-06T15:00:00Z",
    resolved_at: "2026-10-06T13:10:00Z",
    acknowledged_at: "2026-10-06T16:30:00Z",
    resolution_note: "Replaced 15m optical HDMI extender cable behind podium.",
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

export function addIssueType(data: { name: string; description: string; icon?: string }): IssueType {
  const types = getIssueTypes();
  const newType: IssueType = {
    id: `it-${Date.now().toString(36)}`,
    name: data.name.trim(),
    description: data.description.trim(),
    icon: data.icon || "Wrench",
  };
  saveIssueTypes([...types, newType]);
  return newType;
}

export function updateIssueType(id: string, data: Partial<IssueType>): IssueType | null {
  const types = getIssueTypes();
  const idx = types.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  types[idx] = { ...types[idx], ...data };
  saveIssueTypes(types);
  return types[idx];
}

export function deleteIssueType(id: string): boolean {
  const types = getIssueTypes();
  const filtered = types.filter((t) => t.id !== id);
  if (filtered.length === types.length) return false;
  saveIssueTypes(filtered);
  return true;
}

export function getTickets(): Ticket[] {
  const existing = readJson<Ticket[] | null>(STORAGE_TICKETS_KEY, null);
  if (existing === null) {
    writeJson(STORAGE_TICKETS_KEY, DEFAULT_TICKETS);
    return DEFAULT_TICKETS;
  }
  return existing;
}

export function saveTickets(tickets: Ticket[]): void {
  writeJson(STORAGE_TICKETS_KEY, tickets);
}

export function createTicket(payload: {
  title: string;
  description: string;
  issue_type_id: string;
  location: string;
  photo_url?: string;
  creatorName: string;
  creatorId: string;
  creatorRole: "student" | "faculty" | "admin";
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
    expected_by: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Default 48h TAT
  };

  saveTickets([newTicket, ...tickets]);
  return newTicket;
}

export function updateTicket(
  id: string,
  payload: Partial<Pick<Ticket, "title" | "description" | "location" | "issue_type_id" | "photo_url">>,
): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const current = tickets[idx];
  let typeName = current.issue_type_name;
  if (payload.issue_type_id && payload.issue_type_id !== current.issue_type_id) {
    const it = getIssueTypes().find((item) => item.id === payload.issue_type_id);
    if (it) typeName = it.name;
  }

  tickets[idx] = {
    ...current,
    ...payload,
    issue_type_name: typeName,
  };
  saveTickets(tickets);
  return tickets[idx];
}

export function updateTicketStatus(
  id: string,
  newStatus: TicketStatus,
  resolutionNote?: string,
  expectedBy?: string,
): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const current = tickets[idx];
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
  return updated;
}

export function acknowledgeTicket(id: string): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  tickets[idx] = {
    ...tickets[idx],
    status: "ACKNOWLEDGED",
    acknowledged_at: new Date().toISOString(),
  };
  saveTickets(tickets);
  return tickets[idx];
}

export function deleteTicket(id: string): boolean {
  const tickets = getTickets();
  const filtered = tickets.filter((t) => t.id !== id);
  if (filtered.length === tickets.length) return false;
  saveTickets(filtered);
  return true;
}

export function computeFixItStats(tickets: Ticket[], currentUserId?: string | null) {
  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED" || t.status === "ACKNOWLEDGED").length;
  const overdue = tickets.filter(isTicketOverdue).length;
  const myTickets = currentUserId
    ? tickets.filter(
        (t) =>
          t.created_by.toLowerCase() === currentUserId.toLowerCase() ||
          t.created_by_name.toLowerCase().includes(currentUserId.toLowerCase()),
      ).length
    : tickets.length;

  return { total, open, resolved, overdue, myTickets };
}

