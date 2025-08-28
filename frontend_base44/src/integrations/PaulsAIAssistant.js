export const PaulsAIAssistant = {
  async ask({ message }) {
    const baseUrl = import.meta.env.VITE_API_BASE;
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!baseUrl) throw new Error("VITE_API_BASE is not set");

    const resp = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-KEY": apiKey } : {}),
      },
      body: JSON.stringify({ question: message }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Request failed: ${resp.status} ${text}`);
    }

    const data = await resp.json().catch(() => ({}));
    // Normalize to a common shape the ChatPage expects
    return {
      response: data?.answer ?? data?.response ?? "",
      sources: data?.sources ?? [],
      raw: data,
    };
  },
};
