import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user || session.error === "RefreshTokenError") redirect("/sign-in");

  return <main className="flex flex-row">{children}</main>;
}
