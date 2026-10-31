/**
 * CampusOS Admin user management API.
 * Backend: POST/GET /api/v1/admin/users, DELETE /api/v1/admin/users/{email_id}.
 * Students, faculty and office staff are created here; they then sign in with the
 * team's admin OTP.
 */

import { ApiError, apiRequest } from "./api-client";

export type AdminUserRole = "student" | "faculty" | "office_staff";

export const ADMIN_USER_ROLES: AdminUserRole[] = ["student", "faculty", "office_staff"];

export const ROLE_LABELS: Record<AdminUserRole, string> = {
  student: "Student",
  faculty: "Faculty",
  office_staff: "Office Staff",
};

export interface AdminUser {
  role: AdminUserRole;
  team_id: string;
  name: string;
  email_id: string;
  phone_number: string;
  usn?: string | null;
  dept?: string | null;
  designation?: string | null;
  created_at: string;
  updated_at: string;
  otp: string;
  created_by: string;
}

export interface AdminUserList {
  items: AdminUser[];
  count: number;
  next_cursor?: string | null;
}

export type AdminUserCreateBody =
  | {
      role: "student";
      name: string;
      usn: string;
      dept: string;
      email_id: string;
      phone_number: string;
    }
  | { role: "faculty"; name: string; designation: string; email_id: string; phone_number: string }
  | {
      role: "office_staff";
      name: string;
      dept: string;
      designation: string;
      email_id: string;
      phone_number: string;
    };

export interface AdminUserDraft {
  role: AdminUserRole;
  name: string;
  usn: string;
  dept: string;
  designation: string;
  email_id: string;
  phone_number: string;
}

export const USN_FIELD_PATTERN = /^[A-Za-z0-9]{5,20}$/;
export const PHONE_FIELD_PATTERN = /^\+?[0-9]{10,15}$/;
const EMAIL_FIELD_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emptyDraft(role: AdminUserRole): AdminUserDraft {
  return { role, name: "", usn: "", dept: "", designation: "", email_id: "", phone_number: "" };
}

/** Client-side mirror of the backend schema so obvious mistakes never hit the network. */
export function validateAdminUserDraft(draft: AdminUserDraft): string | null {
  const name = draft.name.trim();
  if (name.length < 2 || name.length > 100) return "Enter a full name (2–100 characters).";

  if (!EMAIL_FIELD_PATTERN.test(draft.email_id.trim())) return "Enter a valid email address.";

  if (!PHONE_FIELD_PATTERN.test(draft.phone_number.trim())) {
    return "Enter a valid phone number (10–15 digits).";
  }

  if (draft.role === "student") {
    if (!USN_FIELD_PATTERN.test(draft.usn.trim())) {
      return "Enter a valid USN (5–20 letters or digits).";
    }
    return withinRange(draft.dept, 2, 60, "Enter a department (2–60 characters).");
  }

  if (draft.role === "faculty") {
    return withinRange(draft.designation, 2, 60, "Enter a designation (2–60 characters).");
  }

  const deptError = withinRange(draft.dept, 2, 60, "Enter a department (2–60 characters).");
  if (deptError) return deptError;
  return withinRange(draft.designation, 2, 60, "Enter a designation (2–60 characters).");
}

function withinRange(value: string, min: number, max: number, message: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return message;
  return null;
}

function toCreateBody(draft: AdminUserDraft): AdminUserCreateBody {
  const name = draft.name.trim();
  const email_id = draft.email_id.trim().toLowerCase();
  const phone_number = draft.phone_number.trim();

  if (draft.role === "student") {
    return {
      role: "student",
      name,
      usn: draft.usn.trim().toUpperCase(),
      dept: draft.dept.trim(),
      email_id,
      phone_number,
    };
  }
  if (draft.role === "faculty") {
    return {
      role: "faculty",
      name,
      designation: draft.designation.trim(),
      email_id,
      phone_number,
    };
  }
  return {
    role: "office_staff",
    name,
    dept: draft.dept.trim(),
    designation: draft.designation.trim(),
    email_id,
    phone_number,
  };
}

export async function listAdminUsers(role?: AdminUserRole): Promise<AdminUser[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (role) params.set("role", role);
  const res = await apiRequest<AdminUserList>(`/admin/users?${params.toString()}`);
  return res?.items ?? [];
}

export async function createAdminUser(draft: AdminUserDraft): Promise<AdminUser> {
  return apiRequest<AdminUser>("/admin/users", { method: "POST", json: toCreateBody(draft) });
}

export async function deleteAdminUser(emailId: string): Promise<void> {
  await apiRequest(`/admin/users/${encodeURIComponent(emailId)}`, { method: "DELETE" });
}

/** Turns a thrown ApiError into a message that is safe to show in the UI. */
export function describeAdminUserError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your admin session has expired. Please sign in again.";
    if (error.status === 403) return "This account is not allowed to manage campus users.";
    if (error.status === 409) return "That email or USN is already in use.";
    if (error.status === 429) return "Too many requests — please wait a moment and try again.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
