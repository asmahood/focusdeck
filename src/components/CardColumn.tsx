interface CardColumnProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

export function CardColumn({ title, count, children }: CardColumnProps) {
  return (
    <section
      className="flex h-[calc(100vh-2rem)] min-w-[280px] flex-col border-r border-neutral-800 bg-neutral-900 lg:min-w-0"
      aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2.5">
        <h2
          id={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}
          className="text-sm font-semibold text-neutral-50"
        >
          {title}
        </h2>
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-800 px-1.5 text-xs font-semibold text-neutral-400">
          {count}
        </span>
      </div>

      {/* Scrollable Card Container */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">{children}</div>
    </section>
  );
}
