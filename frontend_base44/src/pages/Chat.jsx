
import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { PaulsAIAssistant } from "@/integrations/PaulsAIAssistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { appendZl } from "@/lib/utils/index.js";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        type: "bot",
        content: appendZl("Hello, what would you like to know about Paul Z\"L today?"),
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      content: appendZl(inputMessage),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await PaulsAIAssistant.ask({
        message: inputMessage,
      });

      const botMessage = {
        type: "bot",
        content: appendZl(response.response || response.answer || response),
        sources: Array.isArray(response.sources) ? response.sources : [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      await ChatMessage.create({
        message: inputMessage,
        response: botMessage.content,
        session_id: sessionId,
      });
    } catch (error) {
      console.error("RAG Chatbot Error:", error);
      const errorMessage = {
        type: "bot",
        content:
          "I apologize, but I'm having trouble accessing Paul's information right now. Please try asking your question again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="paul-card rounded-2xl p-4 md:p-6 mb-6 min-h-[60vh] max-h-[65vh] overflow-y-auto">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-4 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "bot" && (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden paul-portrait">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/d4284c277_Screenshot2025-08-18at121929AM.png"
                      alt="Paul Laderman"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <Card
                  className={`max-w-[80%] ${
                    message.type === "user"
                      ? "bg-slate-800 text-white"
                      : "bg-white border-amber-200"
                  }`}
                >
                  <CardContent className="p-4">
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {appendZl(message.content)}
                    </p>
                    {message.type === "bot" && Array.isArray(message.sources) && message.sources.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-slate-700 mb-1">Sources</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {message.sources.map((s, i) => (
                            <li key={i}>
                              <a className="text-blue-700 underline" href={s.link || s.url} target="_blank" rel="noreferrer noopener">
                                {s.title || s.link || s.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p
                      className={`text-xs mt-2 ${
                        message.type === "user"
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>

                {message.type === "user" && (
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start"
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden paul-portrait">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/d4284c277_Screenshot2025-08-18at121929AM.png"
                  alt="Paul Laderman"
                  className="w-full h-full object-cover"
                />
              </div>
              <Card className="bg-white border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Paul is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="paul-card rounded-2xl p-3 md:p-4">
        <div className="flex gap-2 md:gap-3">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            className="flex-1 border-amber-200 focus:border-amber-400 text-base md:text-lg py-3 md:py-6"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="paul-gradient hover:opacity-90 px-4 md:px-6 py-3 md:py-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
          {["Early life", "Core beliefs", "A story", "Profession", "Family"].map(
            (suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() =>
                  setInputMessage(
                    `Tell me about Paul's ${suggestion.toLowerCase()}`
                  )
                }
                disabled={isLoading}
                className="text-xs hover:bg-amber-50 border-amber-200 px-2 py-1 md:px-3"
              >
                {suggestion}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
