import type { FC } from "react";
import Image from "next/image";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  size?: "sm" | "md";
}

const SIZES = {
  sm: { className: "h-8 w-8 text-sm", pixels: 32 },
  md: { className: "h-10 w-10 text-base", pixels: 40 },
};

export const UserAvatar: FC<UserAvatarProps> = ({ name, image, size = "sm" }) => {
  const sizeConfig = SIZES[size];
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (image) {
    return (
      <Image
        src={image}
        alt={name || "User avatar"}
        width={sizeConfig.pixels}
        height={sizeConfig.pixels}
        className={`${sizeConfig.className} rounded-full border border-neutral-700`}
      />
    );
  }

  return (
    <div
      className={`${sizeConfig.className} flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 font-medium text-neutral-300`}
      aria-label={name || "User avatar"}
    >
      {initials}
    </div>
  );
};
