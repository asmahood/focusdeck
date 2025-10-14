import type { FC, ReactNode } from "react";

interface SignInCardProps {
  children: ReactNode;
}

export const SignInCard: FC<SignInCardProps> = ({ children }) => {
  return (
    <div
      className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 shadow-2xl backdrop-blur-sm"
      role="region"
      aria-label="Sign in form"
    >
      {children}
    </div>
  );
};
