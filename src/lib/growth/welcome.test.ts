import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { firstNameOf, isFirstSignIn } = await import("./welcome");

const now = Date.parse("2026-10-15T10:00:00Z");
const ago = (min: number) => new Date(now - min * 60_000).toISOString();

describe("welcome series trigger", () => {
  it("fires only for an account under an hour old that hasn't been welcomed", () => {
    expect(isFirstSignIn({ email: "a@b.in", created_at: ago(0), app_metadata: {} }, now)).toBe(true);
    expect(isFirstSignIn({ email: "a@b.in", created_at: ago(59), app_metadata: {} }, now)).toBe(true);
    expect(isFirstSignIn({ email: "a@b.in", created_at: ago(61), app_metadata: {} }, now)).toBe(false);
    expect(isFirstSignIn({ email: "a@b.in", created_at: ago(1), app_metadata: { welcome_tracked: true } }, now)).toBe(false);
    expect(isFirstSignIn({ email: undefined, created_at: ago(1), app_metadata: {} }, now)).toBe(false);
  });

  it("takes the first name from the profile", () => {
    expect(firstNameOf({ user_metadata: { full_name: "Asha  Verma" } })).toBe("Asha");
    expect(firstNameOf({ user_metadata: { name: "Ravi" } })).toBe("Ravi");
    expect(firstNameOf({ user_metadata: {} })).toBeNull();
  });
});
