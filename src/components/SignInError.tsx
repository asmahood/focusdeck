"use client";

import type { FC } from "react";

interface SignInErrorProps {
  error?: string | null;
  onDismiss?: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "Access was denied. Please try again.",
  Verification: "The verification link has expired or has already been used.",
  OAuthSignin: "Error in constructing the OAuth sign in URL.",
  OAuthCallback: "Error during OAuth callback. Please try again.",
  OAuthCreateAccount: "Could not create OAuth account. Please try again.",
  EmailCreateAccount: "Could not create email account. Please try again.",
  Callback: "Error in the OAuth callback handler route.",
  OAuthAccountNotLinked: "This email is already associated with another account.",
  EmailSignin: "Could not send email. Please try again.",
  CredentialsSignin: "Sign in failed. Please check your credentials.",
  SessionRequired: "Please sign in to access this page.",
  Default: "An unexpected error occurred. Please try again.",
} as const;

const getErrorMessage = (error: string): string => {
  return ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;
};

export const SignInError: FC<SignInErrorProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
      role="alert"
      aria-live="assertive"
    >
      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" />
      </svg>
      <div className="flex-1">
        <p className="font-semibold">Authentication Error</p>
        <p className="mt-1 text-red-400/90">{getErrorMessage(error)}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded p-1 transition-colors hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
          aria-label="Dismiss error"
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
