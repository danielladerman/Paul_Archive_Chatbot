import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { appendZl } from "@/lib/utils/index.js";

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateString);
  }
}

export default function LifeTimelinePage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE;
        if (!baseUrl) {
          setEvents([]);
          setError("The service is not fully configured right now. Timeline data is unavailable.");
          return;
        }
        const response = await fetch(`${baseUrl}/timeline`);
        if (!response.ok) {
          throw new Error(`Failed to load timeline (${response.status})`);
        }
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading timeline:", err);
        setError("Sorry, something went wrong while loading the timeline.");
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  const eventsByYear = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return da.getTime() - db.getTime();
    });

    const map = new Map();
    for (const ev of sorted) {
      const year = ev.date ? new Date(ev.date).getFullYear() : "Undated";
      if (!map.has(year)) {
        map.set(year, []);
      }
      map.get(year).push(ev);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Undated") return 1;
      if (b === "Undated") return -1;
      return a - b;
    });
  }, [events]);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="paul-card rounded-2xl p-6 md:p-8 paul-glow">
          <h1 className="text-3xl font-light paul-text-gradient mb-4">
            {appendZl("Life Timeline")}
          </h1>
          <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto text-sm md:text-base whitespace-pre-line">
            {appendZl(
              "A chronological view of key moments, roles, and milestones in Rabbi Paul Z\"L's life. Each entry draws from the structured timeline in the family database.\n\n*Help us make this timeline more complete and share your memory or event in the form on the About page or by using the button below."
            )}
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              className="border-amber-300 text-slate-800 bg-amber-50 hover:bg-amber-100"
              onClick={() => navigate("/About#share-memory")}
            >
              Go to memory form
            </Button>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="paul-card rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-slate-600">Loading life timeline…</p>
          </div>
        </div>
      ) : error ? (
        <div className="paul-card rounded-2xl p-6 text-center">
          <p className="text-slate-700 text-sm md:text-base">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="paul-card rounded-2xl p-6 text-center">
          <p className="text-slate-600 text-sm md:text-base">
            No timeline events are available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {eventsByYear.map(([year, yearEvents]) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-800 text-white px-3 py-1 text-sm">
                    {year}
                  </span>
                  <span className="h-px flex-1 bg-amber-200" />
                </h2>

                {yearEvents.map((ev) => (
                  <Card key={ev.id} className="paul-card border-amber-200">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-lg font-medium text-slate-900">
                          {appendZl(ev.title)}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          {ev.category && (
                            <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50">
                              {ev.category}
                            </Badge>
                          )}
                          {ev.location && (
                            <span className="text-xs text-slate-600">
                              {ev.location}
                            </span>
                          )}
                          {ev.date && (
                            <span className="text-xs text-slate-500">
                              {formatDate(ev.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {ev.description && (
                        <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                          {appendZl(ev.description)}
                        </p>
                      )}
                      {ev.significance && (
                        <p className="text-xs md:text-sm text-slate-600 italic">
                          {appendZl(ev.significance)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}


