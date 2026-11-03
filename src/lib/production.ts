import { getSupabaseClient } from "@/lib/supabase";

export async function submitProductionRequest(projectId: string): Promise<void> {
  const { data } = await getSupabaseClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Your session has expired. Sign in again to submit.");
  }

  const response = await fetch("/api/production/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId }),
  });

  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "This project could not be submitted.");
  }
}
