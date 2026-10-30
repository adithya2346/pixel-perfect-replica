import { apiRequest, setStoredToken } from "./api-client";

export type UserRole = "student" | "faculty" | "office_staff";
export type DashboardRole = UserRole | "admin";

export interface NewRegistration {
  fullName: string;
  usn: string;
  email: string;
  mobile: string;
  role: UserRole;
}

export interface RegisteredUser extends NewRegistration {
  id: string;
}

export interface AuthSession {
  name: string;
  usn: string | null;
  role: DashboardRole;
  teamId?: string;
}

/** Predefined frontend demo credentials for the Team 41 administrator portal. */
export const ADMIN_DEMO = {
  name: "Team 41 Admin",
  email: "admin@team41.com",
  phone: "9000000041",
  otp: "472719",
} as const;

export const ADMIN_DEMO_TEAM42 = {
  name: "Team 42 Admin",
  email: "admin@team42.com",
  phone: "9000000042",
  otp: "472719",
} as const;

export const USN_PATTERN = /^[0-9A-Za-z]{1,4}[0-9]{2}[A-Za-z]{2,4}[0-9]{3}$/;
export const MOBILE_PATTERN = /^[6-9][0-9]{9}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateUsn(value: string): string | null {
  const v = value.trim();
  if (!v) return "USN is required.";
  if (!USN_PATTERN.test(v)) return "Enter a valid USN, e.g. 1RV22CS001.";
  return null;
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email address is required.";
  if (!EMAIL_PATTERN.test(v)) return "Enter a valid email address.";
  return null;
}

export function validateMobile(value: string): string | null {
  const v = value.trim().replace(/\s+/g, "");
  if (!v) return "Mobile number is required.";
  if (!MOBILE_PATTERN.test(v)) return "Enter a valid 10-digit mobile number.";
  return null;
}

export function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const USERS_KEY = "campusos-fixit:users";
const SESSION_KEY = "campusos-fixit:session";

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
    /* storage unavailable — demo data simply won't persist */
  }
}

export const DEFAULT_USERS: RegisteredUser[] = [
  {
    id: "demo-student-1",
    fullName: "Aarav Sharma",
    usn: "1RV23CS099",
    email: "aarav.student@campus.edu",
    mobile: "9812345670",
    role: "student",
  },
  {
    id: "demo-faculty-1",
    fullName: "Dr. Priya Raman",
    usn: "1RV18CS042",
    email: "priya.faculty@campus.edu",
    mobile: "9812345671",
    role: "faculty",
  },
  {
    id: "demo-staff-1",
    fullName: "Ravi Shetty",
    usn: "STF-2024-41",
    email: "ravi@team41.com",
    mobile: "9876543211",
    role: "office_staff",
  },
];

export function getRegisteredUsers(): RegisteredUser[] {
  const existing = readJson<RegisteredUser[] | null>(USERS_KEY, null);
  if (existing === null) {
    writeJson(USERS_KEY, DEFAULT_USERS);
    return DEFAULT_USERS;
  }
  return existing;
}

function saveUsers(users: RegisteredUser[]): void {
  writeJson(USERS_KEY, users);
}

/** Returns a human-readable conflict message, or null when the details are free. */
export function findRegistrationConflict(details: NewRegistration): string | null {
  const users = getRegisteredUsers();
  const usn = details.usn.trim().toUpperCase();
  const email = details.email.trim().toLowerCase();
  const mobile = details.mobile.trim();
  if (users.some((u) => u.usn.toUpperCase() === usn)) {
    return "This USN is already registered. Try signing in instead.";
  }
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return "This email address is already registered. Try signing in instead.";
  }
  if (users.some((u) => u.mobile === mobile)) {
    return "This mobile number is already registered. Try signing in instead.";
  }
  return null;
}

export function registerUser(
  details: NewRegistration,
): { ok: true; user: RegisteredUser } | { ok: false; error: string } {
  const conflict = findRegistrationConflict(details);
  if (conflict) return { ok: false, error: conflict };
  const user: RegisteredUser = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fullName: details.fullName.trim(),
    usn: details.usn.trim().toUpperCase(),
    email: details.email.trim().toLowerCase(),
    mobile: details.mobile.trim(),
    role: details.role,
  };
  saveUsers([...getRegisteredUsers(), user]);
  return { ok: true, user };
}

export function findUserByLogin(usn: string, contact: string): RegisteredUser | null {
  const normalizedUsn = usn.trim().toUpperCase();
  const normalizedContact = contact.trim().toLowerCase().replace(/\s+/g, "");
  return (
    getRegisteredUsers().find(
      (user) =>
        user.usn.toUpperCase() === normalizedUsn &&
        (user.email.toLowerCase() === normalizedContact || user.mobile === normalizedContact),
    ) ?? null
  );
}

export function matchesAdminCredentials(email: string, phone: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim().replace(/\s+/g, "");
  const isTeam41 = cleanEmail === ADMIN_DEMO.email && cleanPhone === ADMIN_DEMO.phone;
  const isTeam42 = cleanEmail === ADMIN_DEMO_TEAM42.email && cleanPhone === ADMIN_DEMO_TEAM42.phone;
  return isTeam41 || isTeam42;
}

export function otpMatches(expected: string, entered: string): boolean {
  return entered.trim() === expected;
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function setSession(session: AuthSession): void {
  writeJson(SESSION_KEY, session);
}

export function getSession(): AuthSession | null {
  return readJson<AuthSession | null>(SESSION_KEY, null);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    setStoredToken(null);
  } catch {
    /* ignore */
  }
}

export interface AuthBackendResult {
  ok: boolean;
  token?: string;
  profile?: {
    role: string;
    name: string;
    institution_name?: string;
    team_id?: string;
    usn?: string | null;
    dept?: string;
    email_id?: string;
  };
  error?: string;
}

export async function authenticateWithLiveBackend(
  email: string,
  otp: string,
  isAdmin = false,
): Promise<AuthBackendResult> {
  try {
    const endpoint = isAdmin ? "/auth/admin/login" : "/auth/login";
    const res = await apiRequest<{
      access_token: string;
      profile: {
        role: string;
        name: string;
        institution_name?: string;
        team_id?: string;
        usn?: string | null;
        dept?: string;
        email_id?: string;
      };
    }>(endpoint, {
      method: "POST",
      json: { email_id: email.trim().toLowerCase(), otp: otp.trim() },
    });
    if (res?.access_token) {
      setStoredToken(res.access_token);
      return { ok: true, token: res.access_token, profile: res.profile };
    }
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || "Invalid credentials or OTP.";
    return { ok: false, error: errorMsg };
  }
  return { ok: false, error: "Authentication failed." };
}
