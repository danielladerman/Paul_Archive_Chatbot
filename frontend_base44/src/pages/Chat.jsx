
import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, User, Bot, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    // Welcome message
    setMessages([{
      type: "bot",
      content: "Hello, what would you like to know about Paul today?",
      timestamp: new Date()
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await InvokeLLM({
        prompt: `You are an AI assistant that has been trained on the life, writings, and experiences of Paul Laderman. You should respond as if you are a knowledgeable researcher or biographer who has studied his life extensively. 

User's question: "${inputMessage}"

Please provide a thoughtful, detailed response about Paul Laderman based on his documented experiences, writings, and life events. If you don't have specific information about something, you can acknowledge that while still providing helpful context about his general life, era, or related topics.

Respond in a warm, respectful tone that honors his memory and legacy. Include specific details when possible, and feel free to reference his documents, correspondence, or significant life events.`,
        add_context_from_internet: false
      });

      const botMessage = {
        type: "bot",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Save the conversation
      await ChatMessage.create({
        message: inputMessage,
        response: response,
        session_id: sessionId
      });

    } catch (error) {
      const errorMessage = {
        type: "bot",
        content: "I apologize, but I'm having trouble accessing Paul's information right now. Please try asking your question again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Chat Messages */}
      <div className="paul-card rounded-2xl p-4 md:p-6 mb-6 min-h-[60vh] max-h-[65vh] overflow-y-auto">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden paul-portrait">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/374dfbfd9_Screenshot2025-08-18at121929AM.png"
                      alt="Paul Laderman"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <Card className={`max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white border-amber-200'
                }`}>
                  <CardContent className="p-4">
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>

                {message.type === 'user' && (
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
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/374dfbfd9_Screenshot2025-08-18at121929AM.png"
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

      {/* Message Input */}
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
          {[
            "Early life",
            "Core beliefs", 
            "A story",
            "Profession",
            "Family"
          ].map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setInputMessage(`Tell me about Paul's ${suggestion.toLowerCase()}`)}
              disabled={isLoading}
              className="text-xs hover:bg-amber-50 border-amber-200 px-2 py-1 md:px-3"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
