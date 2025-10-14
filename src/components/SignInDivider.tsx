import type { FC } from "react";

interface SignInDividerProps {
  text?: string;
}

export const SignInDivider: FC<SignInDividerProps> = ({ text = "or" }) => {
  return (
    <div className="relative my-6" role="separator" aria-label={text}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-neutral-800" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-neutral-900/50 px-2 text-neutral-500">{text}</span>
      </div>
    </div>
  );
};
