export const GalleryImage = {
  // JSON schema describing a gallery image record
  schema: {
    name: "GalleryImage",
    type: "object",
    properties: {
      image_url: {
        type: "string",
        format: "uri",
        description: "URL of the uploaded photo",
      },
      title: {
        type: "string",
        description: "Title or caption for the photo",
      },
      description: {
        type: "string",
        description: "A longer description or story behind the photo",
      },
      date_taken: {
        type: "string",
        format: "date",
        description: "Approximate date the photo was taken",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description:
          "Keywords or tags for the photo (e.g., family, vacation, celebration)",
      },
      category: {
        type: "string",
        description: "Category: 'photo' or 'document'",
        default: "photo",
      },
      display_order: {
        type: "integer",
        description: "Display order (higher numbers appear first)",
        default: 0,
      },
    },
    required: ["image_url", "title"],
  },

  async list(order = "-created_date") {
    const base = import.meta.env.VITE_API_BASE;
    if (!base) return [];
    const res = await fetch(`${base}/gallery`);
    if (!res.ok) return [];
    return await res.json();
  },
  async create(payload) {
    const base = import.meta.env.VITE_API_BASE;
    const key = import.meta.env.VITE_API_KEY;
    if (!base) throw new Error("VITE_API_BASE not set");
    const res = await fetch(`${base}/gallery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "X-API-KEY": key } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to create: ${res.status}`);
    return await res.json();
  },
};
