export const CHANNEL = {
  investments: { label: "Investments", sub: "Finance & Investments" },
  ai_technology: { label: "AI & Technology", sub: "AI & Technology" },
  business: { label: "Business", sub: "Businessman & Entrepreneur" },
  builders: { label: "Builders", sub: "Developer & Builder" },
  social_impact: { label: "Social Impact", sub: "Sustainability & Social Impact" },
};

export const CHANNEL_OPTIONS = [
  "business",
  "investments",
  "ai_technology",
  "builders",
  "social_impact",
];

export const JOURNEY = [
  "explorer",
  "connector",
  "builder",
  "challenger",
  "contributor",
  "innovator",
];

export function angka(n) {
  return new Intl.NumberFormat("id-ID").format(n || 0);
}

export function tanggal(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function inisial(nama) {
  return (nama || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
