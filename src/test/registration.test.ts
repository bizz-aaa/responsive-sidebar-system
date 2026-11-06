import { describe, expect, it } from "vitest";
import { signupSchema, signinSchema, completionSchema, phoneSchema, signinErrorMessage } from "@/lib/registration";
const account = { full_name: "Evance Manyanga", phone: "0712345678", password: "StrongPass42!" };
const details = { course: "Computer Science", course_duration: 3, year_of_study: 2, baptized: false, church: "", gender: "male" };
describe("Registration rules", () => {
  it("requires at least two names", () => { expect(signupSchema.safeParse({ ...account, full_name: "Evance" }).success).toBe(false); expect(signupSchema.safeParse(account).success).toBe(true); });
  it("normalizes local phone numbers for phone password login", () => { expect(phoneSchema.parse("0712345678")).toBe("+255712345678"); });
  it("uses the same phone credentials for local and international sign-in", () => {
    expect(signinSchema.parse({ phone: "0712345678", password: account.password })).toEqual({ phone: "+255712345678", password: account.password });
    expect(signinSchema.parse({ phone: "+255712345678", password: account.password })).toEqual({ phone: "+255712345678", password: account.password });
  });
  it("distinguishes disabled phone authentication from invalid credentials", () => {
    expect(signinErrorMessage({ code: "phone_provider_disabled" })).not.toBe(signinErrorMessage({ code: "invalid_credentials" }));
  });
  it("does not require email", () => { expect(signupSchema.parse(account)).toEqual({ ...account, phone: "+255712345678" }); });
  it("requires church membership when baptized", () => { expect(completionSchema.safeParse({ ...details, baptized: true }).success).toBe(false); expect(completionSchema.safeParse({ ...details, baptized: true, church: "Ubungo SDA" }).success).toBe(true); });
  it("requires course details", () => { expect(completionSchema.safeParse({ ...details, course: "" }).success).toBe(false); });
  it("requires male or female gender", () => { expect(completionSchema.safeParse({ ...details, gender: "" }).success).toBe(false); expect(completionSchema.safeParse({ ...details, gender: "female" }).success).toBe(true); });
  it("keeps year of study within course duration", () => { expect(completionSchema.safeParse({ ...details, year_of_study: 4 }).success).toBe(false); });
});