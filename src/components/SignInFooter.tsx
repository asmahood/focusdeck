import type { FC } from "react";

interface SignInFooterProps {
  privacyUrl?: string;
  termsUrl?: string;
}

export const SignInFooter: FC<SignInFooterProps> = ({ privacyUrl, termsUrl }) => {
  return (
    <footer className="mt-8 text-center text-sm text-neutral-500">
      <p className="mb-2">By signing in, you agree to access your GitHub data to display your work dashboard.</p>
      {(privacyUrl || termsUrl) && (
        <nav className="flex items-center justify-center gap-4" aria-label="Legal links">
          {privacyUrl && (
            <a
              href={privacyUrl}
              className="text-neutral-400 underline-offset-4 transition-colors hover:text-neutral-300 hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
          )}
          {termsUrl && (
            <a
              href={termsUrl}
              className="text-neutral-400 underline-offset-4 transition-colors hover:text-neutral-300 hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>
          )}
        </nav>
      )}
    </footer>
  );
};
