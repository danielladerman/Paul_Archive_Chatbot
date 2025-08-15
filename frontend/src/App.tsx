import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:7860";

export default function App() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Array<{ q: string; a: string; sources: Array<{ title: string; link: string }> }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setHistory((h) => [...h, { q: question, a: data.answer, sources: data.sources || [] }]);
      setQuestion("");
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">The Paul Project</h1>
        <p className="text-gray-600 mt-1">Ask about Paul's life and writings. Answers are grounded in archived documents.</p>

        <div className="flex gap-2 mt-5">
          <Input
            className="flex-1"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="What would you like to know about Paul?"
          />
          <Button onClick={ask} disabled={loading}>
            {loading ? "Thinking…" : "Ask"}
          </Button>
        </div>

        {error && <div className="mt-3 text-red-600">Error: {error}</div>}

        <div className="mt-6 grid gap-3">
          {history.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="font-semibold mb-1">You</div>
              <div>{item.q}</div>
              <div className="h-2" />
              <div className="font-semibold mb-1">Paul Scholar</div>
              <div className="whitespace-pre-wrap">{item.a}</div>
              {item.sources?.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold mb-1">Sources</div>
                  <ul className="list-disc pl-5">
                    {item.sources.map((s, j) => (
                      <li key={j}>
                        <a className="text-blue-700 underline" href={s.link} target="_blank" rel="noreferrer noopener">{s.title}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


