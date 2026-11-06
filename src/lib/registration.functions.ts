import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { signupSchema, completionSchema } from "./registration";

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signupSchema.parse(input))
  .handler(async ({ data }) => {
    // Explicit phone-only signup without SMS, as requested. This is not proof of phone ownership.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.createUser({ phone: data.phone, password: data.password, phone_confirm: true, user_metadata: { full_name: data.full_name } });
    if (error) return { error: "Usajili umeshindikana. Namba inaweza kuwa imesajiliwa tayari, au password haijakidhi masharti." };
    return { error: null };
  });
export const getProfile = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("profiles").select("*").eq("id", context.userId).single();
  if (error) throw new Error("Taarifa zako hazikupatikana.");
  return data;
});
export const completeRegistration = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => completionSchema.parse(input)).handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase.from("profiles").update({ ...data, church: data.baptized ? data.church : null, registration_complete: true }).eq("id", context.userId).select().single();
    if (error) throw new Error("Taarifa hazijahifadhiwa. Jaribu tena.");
    return profile;
  });