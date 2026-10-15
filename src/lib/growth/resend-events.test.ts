import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { claimWelcome, firstNameOf, isFirstSignIn } = await import("./resend-events");

const now = Date.parse("2026-10-15T10:00:00Z");
const ago = (min: number) => new Date(now - min * 60_000).toISOString();

describe("Resend welcome series", () => {
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it("treats only a freshly confirmed, not-yet-welcomed account as a first sign-in", () => {
    expect(isFirstSignIn({ email: "a@b.in", email_confirmed_at: ago(0) }, now)).toBe(true);
    expect(isFirstSignIn({ email: "a@b.in", email_confirmed_at: ago(55) }, now)).toBe(true);
    expect(isFirstSignIn({ email: "a@b.in", email_confirmed_at: ago(61) }, now)).toBe(false);
    expect(isFirstSignIn({ email: "a@b.in", email_confirmed_at: ago(60 * 24 * 30) }, now)).toBe(false);
    expect(isFirstSignIn({ email: "a@b.in", email_confirmed_at: null }, now)).toBe(false);
    expect(isFirstSignIn({ email: "a@b.in", email_confirmed_at: ago(1), user_metadata: { welcome_sent: true } }, now)).toBe(false);
    expect(isFirstSignIn({ email: null, email_confirmed_at: ago(1) }, now)).toBe(false);
  });

  it("takes the first name from Google's profile fields", () => {
    expect(firstNameOf({ user_metadata: { full_name: "Asha  Verma" } })).toBe("Asha");
    expect(firstNameOf({ user_metadata: { given_name: "Ravi", full_name: "Ravi Kumar" } })).toBe("Ravi");
    expect(firstNameOf({ user_metadata: {} })).toBeNull();
  });

  it("flags the user before handing back who to welcome, and does nothing without Resend", async () => {
    const updateUser = vi.fn(async () => ({ error: null }));
    const user = { email: "a@b.in", email_confirmed_at: new Date().toISOString(), user_metadata: { name: "Asha" } };
    expect(await claimWelcome({ auth: { updateUser } }, user)).toBeNull();
    expect(updateUser).not.toHaveBeenCalled();

    process.env.RESEND_API_KEY = "re_test";
    expect(await claimWelcome({ auth: { updateUser } }, user)).toEqual({ email: "a@b.in", firstName: "Asha" });
    expect(updateUser).toHaveBeenCalledWith({ data: { welcome_sent: true } });

    const failing = vi.fn(async () => ({ error: new Error("nope") }));
    expect(await claimWelcome({ auth: { updateUser: failing } }, user)).toBeNull();
  });
});
