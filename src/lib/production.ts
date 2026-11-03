import { getSupabaseClient } from "@/lib/supabase";

export interface ProductionSync {
  ok: boolean;
  synced: boolean;
  status: string;
  stage?: string;
  progress?: number | null;
  delivered?: boolean;
  error?: string | null;
  message?: string;
}

export async function syncProductionStatus(projectId: string): Promise<ProductionSync> {
  const { data } = await getSupabaseClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Your session has expired. Sign in again to check progress.");
  }

  const response = await fetch("/api/production/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId }),
  });

  const payload = (await response.json().catch(() => ({}))) as ProductionSync;
  if (!response.ok) {
    throw new Error(payload.message || "Production progress could not be checked.");
  }
  return payload;
}
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
