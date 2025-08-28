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
    },
    required: ["image_url", "title"],
  },

  async list(order = "-created_date") {
    // TODO: Replace with real data source; returning empty list for now
    return [];
  },
  async create(payload) {
    // TODO: Persist to your backend or storage; no-op for now
    return { ok: true, id: Date.now(), ...payload };
  },
};
