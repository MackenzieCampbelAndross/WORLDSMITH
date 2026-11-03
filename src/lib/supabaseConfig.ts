// Public Supabase client configuration. These values ship in the browser and are
// protected by RLS; env vars override them when the project changes.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gifmcybfktzetsnjblpt.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_yi401LyArEcdNGW1pw0xvg_gKhS49au";
