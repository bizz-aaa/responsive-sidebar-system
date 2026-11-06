import { z } from "zod";

export const phoneSchema = z.string().trim().max(25).transform((value) => {
  const clean = value.replace(/[\s()-]/g, "");
  return /^0[67]\d{8}$/.test(clean) ? `+255${clean.slice(1)}` : clean.startsWith("+") ? clean : `+${clean}`;
}).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Weka namba sahihi, mfano 0712345678 au +255712345678."));
export const signupSchema = z.object({
  full_name: z.string().trim().min(3).max(150).refine((name) => name.split(/\s+/).length >= 2, "Weka majina angalau mawili."),
  phone: phoneSchema,
  password: z.string().min(8, "Password iwe na herufi angalau 8.").max(128),
});
export const signinSchema = signupSchema.pick({ phone: true, password: true });
export const completionSchema = z.object({
  course: z.string().trim().min(1, "Weka kozi yako.").max(150),
  course_duration: z.coerce.number().int().min(1).max(10),
  year_of_study: z.coerce.number().int().min(1).max(10),
  baptized: z.boolean(),
  church: z.string().trim().max(150),
  gender: z.enum(["female", "male"]),
}).refine((v) => v.year_of_study <= v.course_duration, { message: "Mwaka wa masomo usizidi muda wa kozi.", path: ["year_of_study"] })
  .refine((v) => !v.baptized || v.church.length > 0, { message: "Weka kanisa lenye ushirika wako.", path: ["church"] });

export function pageHead(title: string, description: string) {
  return { meta: [{ title: `${title} — TUCASA Nyerere Campus` }, { name: "description", content: description }, { property: "og:title", content: `${title} — TUCASA Nyerere Campus` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}