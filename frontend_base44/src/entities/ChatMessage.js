export const ChatMessage = {
  // JSON schema describing a chat message record
  schema: {
    name: "ChatMessage",
    type: "object",
    properties: {
      message: { type: "string", description: "The user's question or message" },
      response: { type: "string", description: "The AI's response about Paul" },
      context_used: {
        type: "array",
        items: { type: "string" },
        description: "Documents or information sources referenced",
      },
      session_id: { type: "string", description: "Conversation session identifier" },
    },
    required: ["message", "response"],
    rls: {
      read: {
        $or: [
          { created_by: "{{user.email}}" },
          { user_condition: { role: "admin" } },
        ],
      },
      write: {
        $or: [
          { created_by: "{{user.email}}" },
          { user_condition: { role: "admin" } },
        ],
      },
    },
  },

  async create({ message, response, session_id, context_used = [] }) {
    // Placeholder: extend to POST to your backend for persistence
    try {
      return { ok: true, message, response, session_id, context_used };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
