"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { providerMap } from "@/auth";
import {
  SignInLayout,
  SignInCard,
  SignInHeader,
  SignInForm,
  SignInError,
  SignInFooter,
  FeatureHighlights,
} from "@/components";
import { handleSignIn } from "./actions";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <SignInLayout>
      <SignInCard>
        <SignInHeader
          title="Welcome to FocusDeck"
          description="Centralize your GitHub work in a single dashboard. Track issues, pull requests, and reviews all in one place."
          showLogo
        >
          <FeatureHighlights />
        </SignInHeader>

        {error && <SignInError error={error} />}

        {Object.values(providerMap).map((provider) => (
          <form key={provider.id} action={() => handleSignIn(provider.id)}>
            <SignInForm provider={provider} />
          </form>
        ))}

        <SignInFooter />
      </SignInCard>
    </SignInLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <SignInLayout>
          <SignInCard>
            <SignInHeader
              title="Welcome to FocusDeck"
              description="Centralize your GitHub work in a single dashboard. Track issues, pull requests, and reviews all in one place."
              showLogo
            />
          </SignInCard>
        </SignInLayout>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
