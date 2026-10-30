import { beforeEach, describe, expect, it } from "vitest";

import {
  ADMIN_DEMO,
  findRegistrationConflict,
  findUserByLogin,
  matchesAdminCredentials,
  otpMatches,
  registerUser,
  validateEmail,
  validateMobile,
  validateUsn,
} from "@/lib/mock-auth";

const VALID_REGISTRATION = {
  fullName: "Ananya Sharma",
  usn: "1RV22CS001",
  email: "ananya@campus.edu",
  mobile: "9876543210",
  role: "student" as const,
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("field validation", () => {
  it("accepts a standard USN and rejects malformed values", () => {
    expect(validateUsn("1RV22CS001")).toBeNull();
    expect(validateUsn("4gh21ec115")).toBeNull();
    expect(validateUsn("")).not.toBeNull();
    expect(validateUsn("12CS01")).not.toBeNull();
    expect(validateUsn("hello world")).not.toBeNull();
  });

  it("accepts valid emails and rejects broken ones", () => {
    expect(validateEmail("student@campus.edu")).toBeNull();
    expect(validateEmail("")).not.toBeNull();
    expect(validateEmail("not-an-email")).not.toBeNull();
  });

  it("accepts 10-digit mobile numbers starting 6-9 and rejects others", () => {
    expect(validateMobile("9876543210")).toBeNull();
    expect(validateMobile("6123456789")).toBeNull();
    expect(validateMobile("")).not.toBeNull();
    expect(validateMobile("12345")).not.toBeNull();
    expect(validateMobile("0987654321")).not.toBeNull();
  });
});

describe("Team 41 admin demo credentials", () => {
  it("matches only the exact predefined admin email and phone", () => {
    expect(ADMIN_DEMO.email).toBe("admin@team41.com");
    expect(ADMIN_DEMO.phone).toBe("9000000041");
    expect(ADMIN_DEMO.otp).toBe("472719");
    expect(matchesAdminCredentials("admin@team41.com", "9000000041")).toBe(true);
    expect(matchesAdminCredentials("Admin@Team42.com ", "9000000042")).toBe(true);
    expect(matchesAdminCredentials("admin@team41.com", "9999999999")).toBe(false);
    expect(matchesAdminCredentials("student@campus.edu", "9000000041")).toBe(false);
  });

  it("accepts only the predefined admin OTP", () => {
    expect(otpMatches(ADMIN_DEMO.otp, "472719")).toBe(true);
    expect(otpMatches(ADMIN_DEMO.otp, "123456")).toBe(false);
  });
});

describe("registration and login mock store", () => {
  it("registers a user and lets them sign in with USN + email or mobile", () => {
    const result = registerUser(VALID_REGISTRATION);
    expect(result.ok).toBe(true);
    expect(findRegistrationConflict(VALID_REGISTRATION)).not.toBeNull();

    expect(findUserByLogin("1rv22cs001", "9876543210")?.fullName).toBe("Ananya Sharma");
    expect(findUserByLogin("1RV22CS001", "ananya@campus.edu")?.role).toBe("student");
    expect(findUserByLogin("1RV22CS001", "someone@campus.edu")).toBeNull();
    expect(findUserByLogin("1RV22CS999", "9876543210")).toBeNull();
  });

  it("rejects duplicate USN, email and mobile registrations", () => {
    expect(registerUser(VALID_REGISTRATION).ok).toBe(true);
    expect(findRegistrationConflict({ ...VALID_REGISTRATION, email: "new@campus.edu" })).toMatch(
      /USN/i,
    );
    expect(findRegistrationConflict({ ...VALID_REGISTRATION, usn: "1RV22CS002" })).toMatch(
      /email/i,
    );
    expect(
      findRegistrationConflict({ ...VALID_REGISTRATION, usn: "1RV22CS002", email: "new@campus.edu" }),
    ).toMatch(/mobile/i);
  });
});
