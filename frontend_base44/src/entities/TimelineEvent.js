export const TimelineEvent = {
  // JSON schema describing a timeline event
  schema: {
    name: "TimelineEvent",
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the life event",
      },
      description: {
        type: "string",
        description: "Detailed description of the event",
      },
      date: {
        type: "string",
        format: "date",
        description: "Date of the event",
      },
      category: {
        type: "string",
        enum: [
          "birth",
          "education",
          "career",
          "family",
          "achievement",
          "travel",
          "milestone",
          "other",
        ],
        description: "Category of the event",
      },
      location: {
        type: "string",
        description: "Where the event took place",
      },
      significance: {
        type: "string",
        description: "Why this event was important",
      },
    },
    required: ["title", "description", "date", "category"],
  },

  // Placeholder: replace with real data source or API later
  async list(orderBy = "date") {
    const base = import.meta.env.VITE_API_BASE;
    if (!base) return [];
    const res = await fetch(`${base}/timeline`);
    if (!res.ok) return [];
    return await res.json();
  },
  async create(payload) {
    const base = import.meta.env.VITE_API_BASE;
    const key = import.meta.env.VITE_API_KEY;
    if (!base) throw new Error("VITE_API_BASE not set");
    const res = await fetch(`${base}/timeline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "X-API-KEY": key } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to create: ${await res.text()}`);
    return await res.json();
  },
};
