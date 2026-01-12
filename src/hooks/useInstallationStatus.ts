"use client";

import { useState, useEffect, useCallback } from "react";
import type { InstallationStatus } from "@/types/installation";

interface UseInstallationStatusReturn {
  status: InstallationStatus | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useInstallationStatus(): UseInstallationStatusReturn {
  const [status, setStatus] = useState<InstallationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github-app/status");
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, isLoading, error, refetch: fetchStatus };
}
