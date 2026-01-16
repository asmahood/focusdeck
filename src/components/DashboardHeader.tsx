"use client";

import type { FC } from "react";
import { BrandLogo } from "./BrandLogo";
import { UserAvatar } from "./UserAvatar";
import { SettingsDropdown } from "./SettingsDropdown";
import { ConnectionStatus } from "./ConnectionStatus";

interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ user }) => {
  return (
    <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 py-3">
      {/* Left: Brand Logo */}
      <BrandLogo size="sm" showText={true} />

      {/* Right: User section with settings */}
      <div className="flex items-center gap-3">
        <ConnectionStatus />
        <SettingsDropdown />
        <UserAvatar name={user.name} image={user.image} />
      </div>
    </header>
  );
};
