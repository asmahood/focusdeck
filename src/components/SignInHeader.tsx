import type { FC, ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

interface SignInHeaderProps {
  title?: string;
  description?: string;
  showLogo?: boolean;
  children?: ReactNode;
}

export const SignInHeader: FC<SignInHeaderProps> = ({
  title = "Welcome to FocusDeck",
  description = "Centralize your GitHub work in a single dashboard. Track issues, pull requests, and reviews all in one place.",
  showLogo = false,
  children,
}) => {
  return (
    <header className="mb-8 text-center">
      {showLogo && (
        <div className="mb-6 flex justify-center">
          <BrandLogo size="lg" />
        </div>
      )}
      <h1 className="mb-3 bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
        {title}
      </h1>
      <p className="mb-6 text-base text-neutral-400">{description}</p>
      {children}
    </header>
  );
};
