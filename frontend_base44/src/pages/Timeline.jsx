
import React, { useState, useEffect } from "react";
import { TimelineEvent } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Star, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const categoryColors = {
  birth: "bg-pink-100 text-pink-800 border-pink-200",
  education: "bg-blue-100 text-blue-800 border-blue-200", 
  career: "bg-purple-100 text-purple-800 border-purple-200",
  family: "bg-green-100 text-green-800 border-green-200",
  achievement: "bg-yellow-100 text-yellow-800 border-yellow-200",
  travel: "bg-indigo-100 text-indigo-800 border-indigo-200",
  milestone: "bg-red-100 text-red-800 border-red-200",
  other: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const fetchedEvents = await TimelineEvent.list("date");
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
    setIsLoading(false);
  };

  const toggleExpanded = (eventId) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="paul-card rounded-2xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Paul's timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="paul-card rounded-2xl p-6 md:p-8 paul-glow">
          <h1 className="text-3xl font-light paul-text-gradient mb-4">
            Paul's Life Journey
          </h1>
          <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto text-sm md:text-base">
            Explore the significant moments, achievements, and experiences that shaped Paul Laderman's remarkable life.
          </p>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-slate-300 to-amber-400"></div>

        <AnimatePresence>
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-10 md:pl-12 pb-8"
            >
              {/* Timeline Dot */}
              <div className="absolute left-1.5 md:left-2 w-4 h-4 bg-amber-400 rounded-full border-4 border-white shadow-lg paul-glow"></div>

              <Card className="paul-card border-amber-200 paul-glow hover:shadow-lg transition-all duration-300">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleExpanded(event.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={categoryColors[event.category] || categoryColors.other}>
                          {event.category.replace("_", " ")}
                        </Badge>
                        {event.date && (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(event.date), "MMMM d, yyyy")}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xl font-medium paul-text-gradient">
                        {event.title}
                      </CardTitle>
                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    {expandedEvents.has(event.id) ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {expandedEvents.has(event.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          {event.description}
                        </p>
                        
                        {event.significance && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="w-4 h-4 text-amber-600" />
                              <span className="font-medium text-amber-800">Significance</span>
                            </div>
                            <p className="text-amber-700 text-sm leading-relaxed">
                              {event.significance}
                            </p>
                          </div>
                        )}

                        {event.related_documents && event.related_documents.length > 0 && (
                          <div>
                            <h4 className="font-medium text-slate-800 mb-2">Related Documents:</h4>
                            <div className="flex flex-wrap gap-2">
                              {event.related_documents.map((doc, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="paul-card rounded-2xl p-8 text-center">
            <p className="text-slate-600">No life events have been added to the timeline yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
