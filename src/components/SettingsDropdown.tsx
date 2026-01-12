"use client";

import { useState, useRef, useEffect, type FC } from "react";
import { InstallationStatus } from "./InstallationStatus";
import { useInstallationStatus } from "@/hooks";

const GITHUB_APP_INSTALL_URL = "https://github.com/apps/focus-deck/installations/new";

export const SettingsDropdown: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { status, isLoading } = useInstallationStatus();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings gear icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="Settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-md border border-neutral-800 bg-neutral-900 py-1 shadow-lg">
          {/* Real-Time Updates Section */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-50">Real-Time Updates</h3>
                <p className="mt-0.5 text-xs text-neutral-400">Get instant notifications when issues or PRs change</p>
              </div>
              <InstallationStatus installed={status?.installed} isLoading={isLoading} />
            </div>

            {!status?.installed && (
              <a
                href={GITHUB_APP_INSTALL_URL}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                </svg>
                Enable Real-Time Updates
              </a>
            )}

            {status?.installed && (
              <div className="mt-3 rounded-md bg-neutral-800 px-3 py-2 text-xs text-neutral-400">
                Real-time updates are enabled. Changes will appear automatically.
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-neutral-800" />

          {/* Manage GitHub App Permissions link */}
          <a
            href="https://github.com/settings/installations"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Manage GitHub App Permissions
          </a>
        </div>
      )}
    </div>
  );
};
