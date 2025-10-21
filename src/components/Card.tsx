import { CardData } from "@/types/card";

interface CardProps {
  data: CardData;
}

const STATUS_COLORS = {
  open: "bg-green-500/10 text-green-500 border-green-500/20",
  closed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  merged: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  draft: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
};

const STATUS_ICONS = {
  open: (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
    </svg>
  ),
  closed: (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z" />
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z" />
    </svg>
  ),
  merged: (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z" />
    </svg>
  ),
  draft: (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
      <path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
    </svg>
  ),
};

function isValidHexColor(color: string): boolean {
  return /^[0-9A-Fa-f]{6}$/.test(color);
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  } else {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }
}

export function Card({ data }: CardProps) {
  const visibleLabels = data.labels.slice(0, 3);
  const remainingLabels = data.labels.length - 3;
  const relativeTime = getRelativeTime(data.createdAt);

  return (
    <a
      href={data.url}
      aria-label={`Issue #${data.number}: ${data.title} in ${data.repository.owner}/${data.repository.name}`}
      className="group block rounded-md border border-neutral-800 bg-neutral-800 p-3 transition-all duration-200 hover:scale-[1.01] hover:border-neutral-700 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex flex-col gap-2">
        {/* Status Badge and Labels */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[data.status]}`}
          >
            {STATUS_ICONS[data.status]}
            {data.status}
          </span>
          {visibleLabels.map((label) => {
            const safeColor = isValidHexColor(label.color) ? `#${label.color}` : "#6B7280";
            return (
              <span
                key={label.name}
                className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${safeColor}20`,
                  borderColor: `${safeColor}80`,
                  color: safeColor,
                }}
              >
                {label.name}
              </span>
            );
          })}
          {remainingLabels > 0 && (
            <span className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-700/50 px-1.5 py-0.5 text-xs font-medium text-neutral-400">
              +{remainingLabels}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-50 group-hover:text-white">
          {data.title}
        </h3>

        {/* Repository */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
          </svg>
          <span>
            {data.repository.owner}/{data.repository.name}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span>#{data.number}</span>
          <span>•</span>
          <span>{relativeTime}</span>
          {data.commentCount > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-0.5">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
                </svg>
                <span>{data.commentCount}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </a>
  );
}
