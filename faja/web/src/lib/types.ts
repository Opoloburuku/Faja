export type Stage = "new" | "contacted" | "quoted" | "won" | "lost";

export const STAGES: { id: Stage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "quoted", label: "Quoted" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export type Lead = {
  id: string;
  industry: string;
  service: string;
  title: string;
  reason: string;
  score: number;
  city: string;
  area: string | null;
  address: string | null;
  est_value: number | null;
  occurred_at: string | null;
  expires_at: string;
};

export type Assignment = {
  id: string;
  stage: Stage;
  value: number | null;
  exclusive: boolean;
  rank: number;
  assigned_at: string;
  leads: Lead;
};

export const INDUSTRIES = [
  { id: "cleaning", label: "Cleaning" },
  { id: "landscaping", label: "Landscaping" },
  { id: "painting", label: "Painting" },
];

export const CITIES = [{ id: "Calgary", label: "Calgary, AB", country: "CA" }];
