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
  if (error) throw new Error(error.message);
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
