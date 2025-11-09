import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_TOPICS = [
  "Tell me about Paul's childhood in Denver.",
  "What was Paul's family ancestry and origin?",
  "Describe Paul's early rabbinic career in the USA.",
  "What was Paul's role as a USAF Chaplain?",
  "Tell me about Paul's travels in Europe in 1948-1949.",
  "What are Paul's reflections on Halachah and homosexuality?",
  "Explain the correspondence between Paul and Lamm on homosexuality.",
  "What was Paul's involvement with the Open Hillel at Berkeley in 1971?",
  "Describe Paul's work with community centers in 1983.",
  "Tell me about the story of the lost pocket knife."
];

export default function ContentPage() {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  function toTopicString(item) {
    if (typeof item === "string") return item;
    if (!item) return "";
    if (typeof item.title === "string") return item.title;
    if (typeof item.question === "string") return item.question;
    try {
      return String(item);
    } catch {
      return "";
    }
  }

  // Normalize for display (topic-style)
  function toDisplayLabel(raw) {
    let s = toTopicString(raw).trim();
    s = s.replace(/^Tell me about\s+/i, "");
    s = s.replace(/^(What\s+(?:was|were|is|are|did)\s+)/i, "");
    s = s.replace(/^(Describe|Explain)\s+/i, "");
    s = s.replace(/\?+$/g, "");
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Build the question we actually send when clicked
  function toSendQuestion(raw) {
    const original = toTopicString(raw).trim();
    if (!original) return "";
    if (/\?$/.test(original) || /^Tell me about\s+/i.test(original)) return original;
    const display = toDisplayLabel(original);
    return `Tell me about ${display}`;
  }

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE;
        if (!baseUrl) {
          setTopics(DEFAULT_TOPICS);
          return;
        }
        const response = await fetch(`${baseUrl}/content`);
        if (response.ok) {
          const data = await response.json();
          const rawItems = Array.isArray(data)
            ? data
            : Array.isArray(data?.topics)
              ? data.topics
              : [];
          const normalized = rawItems.map(toTopicString).filter(Boolean);
          setTopics(normalized.length ? normalized : DEFAULT_TOPICS);
        } else {
          setTopics(DEFAULT_TOPICS);
        }
      } catch (error) {
        console.error("Error fetching topics:", error);
        setTopics(DEFAULT_TOPICS);
      }
      setIsLoading(false);
    };

    fetchTopics();
  }, []);

  const handleTopicClick = (topicStr) => {
    const question = toSendQuestion(topicStr);
    // Ensure the viewport is at the top before navigating to Chat
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    navigate("/", { state: { prefilledQuery: question } });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Explore Content</CardTitle>
          <p className="text-slate-600">
            Discover interesting questions and topics to ask the AI about Paul's life, generated from his writings.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
              <p className="ml-2 text-slate-600">Loading topics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topics.map((topic, index) => {
                const label = toDisplayLabel(topic);
                return (
                  <Button
                    key={index}
                    variant="outline"
                    title={label}
                    aria-label={label}
                    className="w-full text-left justify-start h-auto min-h-[44px] py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                    onClick={() => handleTopicClick(topic)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
