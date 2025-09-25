import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = "paul-gallery"; // create this bucket in Supabase (public or use signed URLs)

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function UploadFile({ file }) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  const ext = file.name?.split(".").pop() || "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });
  if (error) throw error;

  // If bucket is public, we can get the public URL directly
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  if (pub?.publicUrl) {
    return { file_url: pub.publicUrl };
  }
  // Else generate a signed URL (valid for 7 days)
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.path, 60 * 60 * 24 * 7);
  if (signErr) throw signErr;
  return { file_url: signed.signedUrl };
}
