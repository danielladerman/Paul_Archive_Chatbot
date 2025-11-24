
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { appendZl } from "@/lib/utils/index.js";
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, HISTORICAL_TOUCHPOINTS, TITLE_TO_CATEGORY, TITLE_RENAMES } from "@/data/timelineData";
import { CUSTOM_BUTTONS } from "@/data/customButtons";

// Helpers to mirror Content.jsx question formatting
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
function toDisplayLabel(raw) {
  let s = toTopicString(raw).trim();
  s = s.replace(/^Tell me about\s+/i, "");
  s = s.replace(/^(What\s+(?:was|were|is|are|did)\s+)/i, "");
  s = s.replace(/^(Describe|Explain)\s+/i, "");
  s = s.replace(/\?+$/g, "");
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function toSendQuestion(raw) {
  const original = toTopicString(raw).trim();
  if (!original) return "";
  if (/\?$/.test(original) || /^Tell me about\s+/i.test(original)) return original;
  const display = toDisplayLabel(original);
  return `Tell me about ${display}`;
}

// Normalize titles to increase robustness of mapping
function normalizeTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-") // en/em dash -> hyphen
    .replace(/[’‘]/g, "'") // curly quotes -> straight
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Safely read custom button config
function getCustomButtons(categoryCode, subCode) {
  if (!CUSTOM_BUTTONS) return [];
  if (categoryCode === "LE") {
    const le = CUSTOM_BUTTONS.LE || {};
    const arr = (subCode && le[subCode]) || [];
    return Array.isArray(arr) ? arr : [];
  }
  if (categoryCode === "HIST") {
    const arr = CUSTOM_BUTTONS.HIST || [];
    return Array.isArray(arr) ? arr : [];
  }
  const arr = CUSTOM_BUTTONS[categoryCode] || [];
  return Array.isArray(arr) ? arr : [];
}

export default function TimelinePage() {
  const navigate = useNavigate();
  const [titles, setTitles] = useState([]);
  const [isLoadingTitles, setIsLoadingTitles] = useState(true);
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [expandedSubcats, setExpandedSubcats] = useState(new Set()); // for Life Events nested sections

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE;
      if (!baseUrl) {
        setTitles([]);
      } else {
        // Use overrides to match title_overrides.json exactly
        const response = await fetch(`${baseUrl}/content?mode=overrides`);
        if (response.ok) {
          const data = await response.json();
          const items = Array.isArray(data) ? data : Array.isArray(data?.topics) ? data.topics : [];
          setTitles(items.map(toTopicString).filter(Boolean));
        } else {
          setTitles([]);
        }
      }
    } catch (error) {
      console.error("Error loading titles:", error);
      setTitles([]);
    }
    setIsLoadingTitles(false);
  };

  // Build a normalized lookup for categories and display renames
  const normalizedCategoryMap = useMemo(() => {
    const map = new Map();
    Object.entries(TITLE_TO_CATEGORY).forEach(([k, v]) => {
      map.set(normalizeTitle(k), v);
    });
    return map;
  }, []);

  const normalizedRenameMap = useMemo(() => {
    const map = new Map();
    Object.entries(TITLE_RENAMES).forEach(([alias, canonical]) => {
      map.set(normalizeTitle(alias), canonical);
    });
    return map;
  }, []);

  const groupedByCategory = useMemo(() => {
    const result = {};
    const subcatMap = {};
    titles.forEach((title) => {
      const norm = normalizeTitle(title);
      const code = normalizedCategoryMap.get(norm) || "UNCAT";
      const top = code.includes("-") ? code.split("-")[0] : code;
      if (!result[top]) result[top] = [];
      result[top].push(title);
      if (code.includes("-")) {
        const sub = code.split("-")[1];
        if (!subcatMap[top]) subcatMap[top] = new Set();
        subcatMap[top].add(sub);
      }
    });
    return { items: result, subcats: subcatMap };
  }, [titles, normalizedCategoryMap]);

  const getDisplay = (t) => normalizedRenameMap.get(normalizeTitle(t)) || toDisplayLabel(t);

  const handleAsk = (raw) => {
    const q = toSendQuestion(typeof raw === "string" ? raw : getDisplay(raw));
    if (!q) return;
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
    navigate("/", { state: { prefilledQuery: q } });
  };

  const toggleExpandedCat = (key) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleExpandedSubcat = (key) => {
    setExpandedSubcats((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="paul-card rounded-2xl p-6 md:p-8 paul-glow">
          <h1 className="text-3xl font-light paul-text-gradient mb-4">
            {appendZl("Paul's Life & Times")}
          </h1>
          <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto text-sm md:text-base">
            {appendZl("Explore Paul’s personal milestones alongside broader historical currents. Tap any topic to ask the AI.")}
          </p>
        </div>
      </motion.div>

      {isLoadingTitles ? (
        <div className="paul-card rounded-2xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading topics…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(CATEGORY_LABELS).map((top) => {
            const titleList = (groupedByCategory.items[top] || []).slice();
            const isOpen = expandedCats.has(top);
            const label = CATEGORY_LABELS[top] || top;
            const desc = CATEGORY_DESCRIPTIONS[top];
            const isLifeEvents = top === "LE";

            return (
              <Card key={top} className="paul-card border-amber-200 paul-glow">
                <CardHeader className="cursor-pointer" onClick={() => toggleExpandedCat(top)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-medium paul-text-gradient">{label}</CardTitle>
                      {!!desc && <p className="text-slate-600 mt-1">{desc}</p>}
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </CardHeader>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                      <CardContent>
                        {isLifeEvents ? (
                          <div className="space-y-4">
                            {[
                              { code: "C", label: "Childhood" },
                              { code: "E", label: "Education" },
                              { code: "P", label: "Professional" },
                              { code: "F", label: "Family" }
                            ].map(({ code, label: subLabel }) => {
                              const subKey = `LE-${code}`;
                              const items = titleList.filter((t) => (normalizedCategoryMap.get(normalizeTitle(t)) || "LE").toUpperCase() === subKey);
                              const custom = getCustomButtons("LE", code);
                              const open = expandedSubcats.has(subKey);
                              return (
                                <div key={subKey} className="border border-amber-200 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandedSubcat(subKey)}
                                    className="w-full text-left px-3 py-2 flex items-center justify-between"
                                    aria-expanded={open}
                                  >
                                    <span className="font-medium text-slate-800">{subLabel}</span>
                                    {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                  </button>
                                  <AnimatePresence>
                                    {open && (
                                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {(custom.length ? custom : items).length > 0 ? (
                                            (custom.length ? custom : items).map((t, idx) => {
                                              const lbl = custom.length ? t.label : getDisplay(t);
                                              const q = custom.length ? (t.question || lbl) : t;
                                              return (
                                                <Button
                                                  key={`${subKey}-${idx}`}
                                                  variant="outline"
                                                  className="w-full text-left justify-start h-auto min-h-[44px] py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                                                  onClick={() => handleAsk(q)}
                                                  title={lbl}
                                                  aria-label={lbl}
                                                >
                                                  {lbl}
                                                </Button>
                                              );
                                            })
                                          ) : (
                                            <div className="text-slate-500 text-sm">No topics yet.</div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}

                            {/* Other Life Events section removed per request */}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(() => {
                              const custom = getCustomButtons(top);
                              const source = custom.length ? custom : titleList;
                              return source.length > 0 ? (
                                source.map((t, idx) => {
                                  const lbl = custom.length ? t.label : getDisplay(t);
                                  const q = custom.length ? (t.question || lbl) : t;
                                  return (
                                    <Button
                                      key={`${top}-${idx}`}
                                      variant="outline"
                                      className="w-full text-left justify-start h-auto min-h-[44px] py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                                      onClick={() => handleAsk(q)}
                                      title={lbl}
                                      aria-label={lbl}
                                    >
                                      {lbl}
                                    </Button>
                                  );
                                })
                              ) : (
                                <div className="text-slate-500 text-sm">No topics yet.</div>
                              );
                            })()}
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}

          {/* Uncategorized bucket removed per request */}

          {/* Historical Touchpoints */}
          <Card className="paul-card border-amber-200 paul-glow">
            <CardHeader className="cursor-pointer" onClick={() => toggleExpandedCat("HIST")}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl font-medium paul-text-gradient">Historical Touchpoints</CardTitle>
                  <p className="text-slate-600 mt-1">
                    Broader events and movements that frame Paul’s era. Tap to ask the AI.
                  </p>
                </div>
                {expandedCats.has("HIST") ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </CardHeader>
            <AnimatePresence>
              {expandedCats.has("HIST") && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(getCustomButtons("HIST").length ? getCustomButtons("HIST") : HISTORICAL_TOUCHPOINTS).map((tp, i) => {
                        const lbl = typeof tp === "string" ? toDisplayLabel(tp) : tp.label;
                        const q = typeof tp === "string" ? tp : (tp.question || tp.label);
                        return (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAsk(q)}
                            title={lbl}
                            aria-label={lbl}
                            className="w-full text-left justify-start h-auto min-h-[44px] py-2 px-3 whitespace-normal break-words leading-snug text-sm"
                          >
                            {lbl}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      )}
    </div>
  );
}
