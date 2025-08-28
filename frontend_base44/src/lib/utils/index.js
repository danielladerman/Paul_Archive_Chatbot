import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function createPageUrl(pageName) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

// Append Z"L after mentions of the name; avoid double-appending and possessive cases
export function appendZl(text) {
  if (typeof text !== 'string' || !text) return text;

  // Define patterns in order of specificity to avoid conflicts.
  const replacements = [
    // Case: "Rabbi Paul Laderman's" -> "Rabbi Paul Laderman Z"L's"
    {
      pattern: /(Rabbi\s+Paul\s+Laderman)('s)/gi,
      replacement: "$1 Z\"L$2",
    },
    // Case: "Paul Laderman's" -> "Paul Laderman Z"L's"
    {
      pattern: /(Paul\s+Laderman)('s)/gi,
      replacement: "$1 Z\"L$2",
    },
    // Case: "Rabbi Paul Laderman" -> "Rabbi Paul Laderman Z"L"
    {
      pattern: /(Rabbi\s+Paul\s+Laderman)(?!\s*Z["”']L)/gi,
      replacement: "$1 Z\"L",
    },
    // Case: "Paul Laderman" -> "Paul Laderman Z"L"
    {
      pattern: /(Paul\s+Laderman)(?!\s*Z["”']L)/gi,
      replacement: "$1 Z\"L",
    },
    // Case: "Paul's" -> "Paul Z"L's"
    {
      pattern: /\b(Paul)('s)\b/gi,
      replacement: "$1 Z\"L$2",
    },
    // Case: "Paul" (as a whole word, not followed by Laderman) -> "Paul Z"L"
    {
      pattern: /\bPaul\b(?!\s+Laderman)(?!\s*Z["”']L)/g,
      replacement: 'Paul Z"L',
    },
  ];

  let processedText = text;

  // Apply each replacement. We iterate through them so we don't have to worry
  // about the order of regex execution.
  for (const rule of replacements) {
    processedText = processedText.replace(rule.pattern, rule.replacement);
  }

  return processedText;
}