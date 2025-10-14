"use server";

import { signIn } from "@/auth";

export async function handleSignIn(providerId: string) {
  await signIn(providerId, { redirectTo: "/dashboard" });
}
