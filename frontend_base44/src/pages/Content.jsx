import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ContentPage() {
  const [people, setPeople] = useState([]);
  const [structuredData, setStructuredData] = useState({ categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPeople = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE;
        if (!baseUrl) {
          setPeople([]);
          setStructuredData({ categories: [] });
          return;
        }
        const response = await fetch(`${baseUrl}/people`);
        if (response.ok) {
          const data = await response.json();
          // Handle both old format (array) and new format (object with entries/structured)
          if (Array.isArray(data)) {
            setPeople(data);
            setStructuredData({ categories: [] });
          } else {
            setPeople(data.entries || []);
            setStructuredData(data.structured || { categories: [] });
          }
        } else {
          setPeople([]);
          setStructuredData({ categories: [] });
        }
      } catch (error) {
        console.error("Error fetching people:", error);
        setPeople([]);
        setStructuredData({ categories: [] });
      }
      setIsLoading(false);
    };

    fetchPeople();
  }, []);

  const filteredBySearch = useMemo(() => {
    const rawQuery = search.trim().toLowerCase();
    if (!rawQuery) return people;

    // Normalize by removing accents so searches are more forgiving
    const normalize = (value) =>
      (value || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const query = normalize(rawQuery);
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return people;

    return people.filter((person) => {
      const haystack = normalize(
        `${person.name ?? ""} ${person.description ?? ""} ${person.category ?? ""} ${person.subcategory ?? ""}`
      );
      // Require every token from the search box to appear somewhere,
      // even if the words are not adjacent (e.g. "yonatan laderman").
      return tokens.every((token) => haystack.includes(token));
    });
  }, [people, search]);

  const groupedByCategory = useMemo(() => {
    const hasSearch = search.trim().length > 0;

    // When no search, use structured data with narratives
    if (!hasSearch && structuredData.categories.length > 0) {
      return structuredData.categories.map(cat => ({
        category: cat.name,
        subgroups: cat.subcategories.map(sub => ([
          sub.name,
          sub.people,
          sub.narrative  // Include narrative in the tuple
        ]))
      }));
    }

    // When searching, search both people AND narratives
    const normalize = (value) =>
      (value || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const query = normalize(search.trim());
    const tokens = query.split(/\s+/).filter(Boolean);

    const categories = new Map();
    const matchedSubcategories = new Set(); // Track which subcategories have narrative matches

    // First, check narratives in structured data
    if (structuredData.categories.length > 0) {
      for (const cat of structuredData.categories) {
        for (const sub of cat.subcategories) {
          const narrativeHaystack = normalize(sub.narrative);
          const narrativeMatches = tokens.every((token) => narrativeHaystack.includes(token));

          if (narrativeMatches && sub.people.length > 0) {
            // Narrative matches - include all people from this subcategory
            matchedSubcategories.add(`${cat.name}|${sub.name}`);

            if (!categories.has(cat.name)) {
              categories.set(cat.name, new Map());
            }
            const subMap = categories.get(cat.name);

            if (!subMap.has(sub.name)) {
              subMap.set(sub.name, { people: [], narrative: sub.narrative });
            }

            // Add all people from this subcategory
            for (const person of sub.people) {
              subMap.get(sub.name).people.push(person);
            }
          }
        }
      }
    }

    // Then add people who match individually (and preserve their narratives if available)
    for (const person of filteredBySearch) {
      const category = person.category || "Other";
      const subcategory = person.subcategory || "";
      const subKey = `${category}|${subcategory}`;

      // Skip if this person's subcategory was already added via narrative match
      if (matchedSubcategories.has(subKey)) {
        continue;
      }

      if (!categories.has(category)) {
        categories.set(category, new Map());
      }
      const subMap = categories.get(category);

      if (!subMap.has(subcategory)) {
        // Find the narrative for this subcategory if it exists
        let narrative = "";
        if (structuredData.categories.length > 0) {
          const cat = structuredData.categories.find(c => c.name === category);
          if (cat) {
            const sub = cat.subcategories.find(s => s.name === subcategory);
            if (sub) {
              narrative = sub.narrative;
            }
          }
        }
        subMap.set(subcategory, { people: [], narrative });
      }
      subMap.get(subcategory).people.push(person);
    }

    // Convert to array format matching the expected structure
    return Array.from(categories.entries()).map(([category, subMap]) => {
      const subgroups = Array.from(subMap.entries())
        .sort(([a], [b]) => {
          if (a === "__no_sub__" || a === "") return -1;
          if (b === "__no_sub__" || b === "") return 1;
          return 0;
        })
        .map(([subKey, data]) => [subKey || "__no_sub__", data.people, data.narrative]);

      return { category, subgroups };
    });
  }, [filteredBySearch, search, structuredData]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>People Glossary</CardTitle>
          <p className="text-slate-600">
            A curated glossary of family, friends, mentors, and communities connected to Rabbi Paul S. Laderman Z&quot;L. To see full relationship to Paul try going up or down the family hierarchy mentioned in the search result.
          </p>
          <div className="mt-4">
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 md:px-4 py-3 shadow-sm">
              <p className="text-sm md:text-base font-semibold text-slate-800 mb-2">
                Search people connected to Rabbi Paul
              </p>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type here a name, relationship, or place, then press Enter"
                className="w-full border-2 border-amber-400 focus:border-amber-600 focus:ring-amber-500 text-base md:text-lg py-3 bg-white"
                aria-label="Search people connected to Rabbi Paul"
              />
            </div>
          </div>
          <p className="text-slate-600 mt-3 text-sm md:text-base">
            *If you cannot find yourself or the details here are outdated, please submit the form on the About page or use the button below.
          </p>
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="border-amber-300 text-slate-800 bg-amber-50 hover:bg-amber-100"
              onClick={() => navigate("/About#share-memory")}
            >
              Go to memory form
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
              <p className="ml-2 text-slate-600">Loading people…</p>
            </div>
          ) : groupedByCategory.length === 0 ? (
            <p className="text-slate-500 text-sm">No people found.</p>
          ) : (
            <div className="space-y-6">
              {groupedByCategory.map(({ category, subgroups }) => (
                <section key={category}>
                  {(() => {
                    const totalEntries = subgroups.reduce(
                      (sum, [, entries]) => sum + entries.length,
                      0
                    );
                    const hasSearch = search.trim().length > 0;
                    const isExpanded =
                      hasSearch || openCategories.includes(category);

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenCategories((prev) =>
                              prev.includes(category)
                                ? prev.filter((c) => c !== category)
                                : [...prev, category]
                            )
                          }
                          className="w-full flex items-center justify-between mb-2 text-left"
                        >
                          <h2 className="text-lg font-semibold text-slate-800">
                            {category}
                          </h2>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {totalEntries}{" "}
                              {totalEntries === 1 ? "entry" : "entries"}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {isExpanded ? "Hide" : "Show"}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="space-y-4">
                            {subgroups.map((subgroup) => {
                              // Handle both formats: [subKey, entries] for search, [subKey, entries, narrative] for no search
                              const subKey = subgroup[0];
                              const entries = subgroup[1];
                              const narrative = subgroup[2] || "";

                              return (
                                <div key={`${category}-${subKey}`}>
                                {subKey !== "__no_sub__" && (
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-semibold text-slate-700">
                                      {subKey}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {entries.length}{" "}
                                      {entries.length === 1
                                        ? "entry"
                                        : "entries"}
                                    </Badge>
                                  </div>
                                )}

                                {/* Display narrative text if exists */}
                                {narrative && (
                                  <div className="mb-3 p-3 bg-slate-50 border-l-4 border-amber-400 rounded">
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                      {narrative}
                                    </p>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  {entries.map((person, idx) => (
                                    <div
                                      key={`${category}-${subKey}-${idx}-${person.name}`}
                                      className="paul-card rounded-lg p-3 border border-amber-200/60"
                                    >
                                      <div className="font-medium text-slate-900">
                                        {person.name}
                                      </div>
                                      {person.description && (
                                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
                                          {person.description}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
