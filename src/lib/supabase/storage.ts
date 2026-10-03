import { createClient } from "./client";

const BUCKET_NAME = "product_images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export interface UploadImageResult {
  url: string;
  path: string;
}

/**
 * Uploads an image to the Supabase product_images storage bucket.
 * Enforces file size and type limits.
 */
export async function uploadProductImage(
  file: File,
  productId?: string
): Promise<UploadImageResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed is 5MB.`
    );
  }

  // Validate mime type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file type (${file.type}). Allowed formats: JPEG, PNG, WEBP, GIF, SVG.`
    );
  }

  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const cleanFileName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();
  const uniqueId = Math.random().toString(36).substring(2, 9);
  const filePath = productId
    ? `${productId}/${Date.now()}-${cleanFileName}-${uniqueId}.${fileExt}`
    : `temp/${Date.now()}-${cleanFileName}-${uniqueId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    path: filePath,
  };
}

/**
 * Deletes an image from the Supabase product_images storage bucket.
 */
export async function deleteProductImage(pathOrUrl: string): Promise<void> {
  const supabase = createClient();
  let filePath = pathOrUrl;

  // Extract path if a full public URL was passed
  if (pathOrUrl.includes(BUCKET_NAME)) {
    const parts = pathOrUrl.split(`${BUCKET_NAME}/`);
    if (parts[1]) {
      filePath = parts[1];
    }
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) {
    console.warn(`Failed to delete file from storage: ${error.message}`);
  }
}
