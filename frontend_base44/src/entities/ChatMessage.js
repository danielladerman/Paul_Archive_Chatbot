export const ChatMessage = {
  async create({ message, response, session_id }) {
    // Placeholder: extend to POST to your own backend for persistence
    try {
      // no-op
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
