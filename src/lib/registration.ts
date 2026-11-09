import { z } from "zod";

export const phoneSchema = z.string().trim().max(25).transform((value) => {
  const clean = value.replace(/[\s()-]/g, "");
  return /^0[67]\d{8}$/.test(clean) ? `+255${clean.slice(1)}` : clean.startsWith("+") ? clean : `+${clean}`;
}).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number, e.g. 0712345678 or +255712345678."));
export const signupSchema = z.object({
  full_name: z.string().trim().min(3).max(150).refine((name) => name.split(/\s+/).length >= 2, "Enter at least two names."),
  phone: phoneSchema,
  password: z.string().min(8, "Password must contain at least 8 characters.").max(128),
});
export const signinSchema = signupSchema.pick({ phone: true, password: true });
export function signinErrorMessage(error: { code?: string | undefined }, signup = false) {
  if (error.code === "phone_provider_disabled") {
    return "Phone sign-in is currently unavailable. The system owner must enable Phone in Lovable Cloud auth settings.";
  }
  if (error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
    return "Too many attempts. Please wait and try again.";
  }
  return signup
    ? "Account created, but sign-in failed. Please try the sign-in page."
    : "Incorrect phone number or password.";
}
export const completionSchema = z.object({
  course: z.string().trim().min(1, "Enter your course.").max(150),
  course_duration: z.coerce.number().int().min(1).max(5),
  year_of_study: z.coerce.number().int().min(1).max(5),
  residence: z.string().trim().min(1, "Enter your residence.").max(150),
  baptized: z.boolean(),
  church: z.string().trim().max(150),
  gender: z.enum(["female", "male"]),
}).refine((v) => v.year_of_study <= v.course_duration, { message: "Year of study cannot exceed course duration.", path: ["year_of_study"] })
  .refine((v) => !v.baptized || v.church.length > 0, { message: "Enter your membership church.", path: ["church"] });

export function pageHead(title: string, description: string) {
  return { meta: [{ title: `${title} — TUCASA Nyerere Campus` }, { name: "description", content: description }, { property: "og:title", content: `${title} — TUCASA Nyerere Campus` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}
export function accountDestination(complete: boolean) { return complete ? "/dashboard" as const : "/complete-registration" as const; }
