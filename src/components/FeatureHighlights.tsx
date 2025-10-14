import type { FC } from "react";

interface Feature {
  icon: "check" | "columns" | "bell";
  text: string;
}

const ICONS = {
  check: (
    <svg
      className="h-5 w-5 flex-shrink-0 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
    </svg>
  ),
  columns: (
    <svg
      className="h-5 w-5 flex-shrink-0 text-blue-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v10M12 3v18M16 7v10" />
    </svg>
  ),
  bell: (
    <svg
      className="h-5 w-5 flex-shrink-0 text-purple-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
} as const;

const DEFAULT_FEATURES: Feature[] = [
  {
    icon: "check",
    text: "Track all your created and assigned issues",
  },
  {
    icon: "columns",
    text: "Manage pull requests and review requests",
  },
  {
    icon: "bell",
    text: "Stay updated with real-time notifications",
  },
];

interface FeatureHighlightsProps {
  features?: Feature[];
}

export const FeatureHighlights: FC<FeatureHighlightsProps> = ({ features = DEFAULT_FEATURES }) => {
  return (
    <ul className="mb-6 space-y-3" role="list" aria-label="FocusDeck features">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-3 text-neutral-400">
          {ICONS[feature.icon]}
          <span>{feature.text}</span>
        </li>
      ))}
    </ul>
  );
};
