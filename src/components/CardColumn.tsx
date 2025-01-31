export function CardColumn({ children }: Readonly<{ children: React.ReactNode }>) {
  return <section className="m-2 overflow-auto rounded-md bg-zinc-900 p-2">{children}</section>;
}
