import { getSupabaseClient } from "@/lib/supabase";

const BUCKET = "project-files";

export async function uploadProjectObject(
  projectId: string,
  category: string,
  file: File,
): Promise<{ path: string }> {
  const supabase = getSupabaseClient();
  const safeName = file.name.replace(/[^\w.-]+/g, "-");
  const path = `${projectId}/${category}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) {
    console.error("[storage] upload rejected", { path, error });
    throw new Error(`Storing the plan failed: ${error.message}`);
  }
  return { path };
}

export async function uploadProjectCover(projectId: string, blob: Blob): Promise<{ path: string }> {
  const supabase = getSupabaseClient();
  const path = `${projectId}/cover/world.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) {
    console.error("[storage] cover upload rejected", { path, error });
    throw new Error(error.message);
  }
  return { path };
}

export async function deleteProjectObject(path: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function createFileSignedUrl(path: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not create a download link.");
  }
  return data.signedUrl;
}

export async function createFileSignedUrls(paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, 60 * 60);
  if (error) return {};
  return Object.fromEntries(
    (data ?? [])
      .filter((entry) => entry.path && entry.signedUrl)
      .map((entry) => [entry.path as string, entry.signedUrl as string]),
  );
}

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
}

export async function uploadClientAsset(
  file: File,
  category: "avatar" | "company-logo" | "brand-logo" | "brand-guidelines" | string,
): Promise<UploadResult> {
  const supabase = getSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to upload files.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const response = await fetch("/api/portal/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(resJson.message || "Failed to upload asset.");
  }

  return {
    url: resJson.url,
    path: resJson.path,
    name: resJson.name,
    size: resJson.size,
  };
}
