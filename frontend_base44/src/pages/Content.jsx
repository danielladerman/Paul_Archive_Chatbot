import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function ContentPage() {
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState([]);

  useEffect(() => {
    const fetchPeople = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE;
        if (!baseUrl) {
          setPeople([]);
          return;
        }
        const response = await fetch(`${baseUrl}/people`);
        if (response.ok) {
          const data = await response.json();
          setPeople(Array.isArray(data) ? data : []);
        } else {
          setPeople([]);
        }
      } catch (error) {
        console.error("Error fetching people:", error);
        setPeople([]);
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
    const categories = new Map();

    for (const person of filteredBySearch) {
      const category = person.category || "Other";
      const subcategory = person.subcategory || "";

      if (!categories.has(category)) {
        categories.set(category, new Map());
      }
      const subMap = categories.get(category);
      const subKey = subcategory || "__no_sub__";
      if (!subMap.has(subKey)) {
        subMap.set(subKey, []);
      }
      subMap.get(subKey).push(person);
    }

    // Preserve the order in which categories appear in people.md
    // instead of forcing an alphabetical sort.
    return Array.from(categories.entries()).map(([category, subMap]) => {
      const subgroups = Array.from(subMap.entries()).sort(([a], [b]) => {
        if (a === "__no_sub__") return -1;
        if (b === "__no_sub__") return 1;
        return a.localeCompare(b);
      });
      return { category, subgroups };
    });
  }, [filteredBySearch]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>People Glossary</CardTitle>
          <p className="text-slate-600">
            A curated glossary of family, friends, mentors, and communities connected to Rabbi Paul S. Laderman Z&quot;L.
          </p>
          <div className="mt-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, relationship, or place…"
              className="w-full"
            />
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
                            {subgroups.map(([subKey, entries]) => (
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
                            ))}
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
