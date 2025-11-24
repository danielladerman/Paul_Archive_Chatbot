import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function ContentPage() {
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        `${person.name ?? ""} ${person.description ?? ""} ${person.category ?? ""}`
      );
      // Require every token from the search box to appear somewhere,
      // even if the words are not adjacent (e.g. "yonatan laderman").
      return tokens.every((token) => haystack.includes(token));
    });
  }, [people, search]);

  const groupedByCategory = useMemo(() => {
    const groups = new Map();
    for (const person of filteredBySearch) {
      const key = person.category || "Other";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(person);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
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
              {groupedByCategory.map(([category, entries]) => (
                <section key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-slate-800">{category}</h2>
                    <Badge variant="outline" className="text-xs">
                      {entries.length} {entries.length === 1 ? "entry" : "entries"}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {entries.map((person, idx) => (
                      <div
                        key={`${category}-${idx}-${person.name}`}
                        className="paul-card rounded-lg p-3 border border-amber-200/60"
                      >
                        <div className="font-medium text-slate-900">{person.name}</div>
                        {person.description && (
                          <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
                            {person.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
