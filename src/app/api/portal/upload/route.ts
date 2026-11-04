import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabaseConfig";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const ALLOWED_PDF_TYPES = new Set([
  "application/pdf",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

const BUCKET_NAME = "client-assets";

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    return json({ message: "Server storage is not configured (missing key)." }, 500);
  }

  // 1. Authenticate user from Bearer token
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "")?.trim();

  if (!token) {
    return json({ message: "Authentication required. Please sign in." }, 401);
  }

  const supabaseService = createClient(SUPABASE_URL, serviceKey);
  const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);

  if (authError || !user) {
    return json({ message: "Session expired or invalid. Please sign in again." }, 401);
  }

  // 2. Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ message: "Invalid form data submission." }, 400);
  }

  const file = formData.get("file");
  const category = (formData.get("category") as string) || "general";

  if (!file || typeof file === "string") {
    return json({ message: "No file was provided in the upload request." }, 400);
  }

  const uploadFile = file as File;
  const mimeType = uploadFile.type?.toLowerCase() || "";
  const size = uploadFile.size;

  // 3. Validate file types & sizes
  const isImageCategory = category === "avatar" || category === "company-logo" || category === "brand-logo";
  const isPdfCategory = category === "brand-guidelines" || category === "guidelines";

  if (isPdfCategory) {
    if (!ALLOWED_PDF_TYPES.has(mimeType) && !uploadFile.name.toLowerCase().endsWith(".pdf")) {
      return json({ message: "Brand guidelines must be a valid PDF document." }, 400);
    }
    if (size > MAX_PDF_BYTES) {
      return json({ message: "PDF document exceeds the 25 MB size limit." }, 400);
    }
  } else if (isImageCategory) {
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return json(
        { message: "Please upload a valid image file (JPEG, PNG, WebP, or SVG)." },
        400,
      );
    }
    if (size > MAX_IMAGE_BYTES) {
      return json({ message: "Image file exceeds the 5 MB size limit." }, 400);
    }
  } else {
    // General check
    if (!ALLOWED_IMAGE_TYPES.has(mimeType) && !ALLOWED_PDF_TYPES.has(mimeType)) {
      return json({ message: "Unsupported file type." }, 400);
    }
  }

  // 4. Ensure bucket exists
  try {
    const { data: buckets } = await supabaseService.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      await supabaseService.storage.createBucket(BUCKET_NAME, { public: true });
    }
  } catch (err) {
    console.error("[storage] list/create bucket warning:", err);
  }

  // 5. Upload file into user folder
  const sanitizedName = uploadFile.name.replace(/[^\w.-]+/g, "-");
  const filePath = `${user.id}/${category}/${Date.now()}-${sanitizedName}`;

  const arrayBuffer = await uploadFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseService.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    console.error("[storage] upload error:", uploadError);
    return json({ message: `Storage error: ${uploadError.message}` }, 500);
  }

  // 6. Get public URL
  const { data: urlData } = supabaseService.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return json({
    success: true,
    url: urlData.publicUrl,
    path: filePath,
    name: uploadFile.name,
    size,
    type: mimeType,
  });
}
