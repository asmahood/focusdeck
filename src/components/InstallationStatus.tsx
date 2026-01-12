import type { FC } from "react";

interface InstallationStatusProps {
  installed?: boolean;
  isLoading?: boolean;
}

export const InstallationStatus: FC<InstallationStatusProps> = ({ installed, isLoading }) => {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Checking...
      </span>
    );
  }

  if (installed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
        </svg>
        Enabled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-400">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
      </svg>
      Not Enabled
    </span>
  );
};
