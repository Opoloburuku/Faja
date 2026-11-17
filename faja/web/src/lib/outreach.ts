import type { Lead } from "./types";

const openers: Record<string, string> = {
  cleaning: "We do post-construction and move-in cleans",
  landscaping: "We handle sod, grading and planting for new and renovated homes",
  painting: "We do interior painting and touch-ups after builds and renovations",
};

export function outreachScript(lead: Lead, business: string): string {
  const area = lead.area ? ` in ${lead.area}` : "";
  return [
    `Hi, this is ${business}. ${openers[lead.industry] ?? "We work with homeowners"}${area}.`,
    `We noticed work is underway at ${lead.address ?? "your property"} and wanted to offer a ${lead.service.toLowerCase()} when you're ready.`,
    `Happy to give a free quote with no obligation. If you'd rather not hear from us, just say so and we won't contact you again.`,
  ].join("\n\n");
}
