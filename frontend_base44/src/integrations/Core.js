export async function UploadFile({ file }) {
  // TODO: integrate real uploader (e.g., Supabase storage)
  // For now, return a data URL or placeholder to keep UI functional
  return {
    file_url:
      typeof window !== "undefined"
        ? URL.createObjectURL(file)
        : "https://placehold.co/600x400/png",
  };
}
