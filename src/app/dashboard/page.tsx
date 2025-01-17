import { auth } from "@/auth"
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/sign-in");

  if (session.error === "RefreshTokenError") redirect("/sign-in")

  return (
    <div>
      <h1>Dashboard page</h1>

      <p>Hello {session.user.name}</p>
    </div>
  )
}