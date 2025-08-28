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
  let out = text;
  // Rabbi Paul Laderman
  out = out.replace(/(Rabbi\s+Paul\s+Laderman)(?!\s*Z["”']L)/gi, "$1 Z\"L");
  // Paul Laderman
  out = out.replace(/(Paul\s+Laderman)(?!\s*Z["”']L)/gi, "$1 Z\"L");
  // Paul (not followed by 's and not already with Z"L)
  out = out.replace(/\bPaul\b(?!'s)(?!\s*Z["”']L)/g, (m) => `${m} Z"L`);
  return out;
}