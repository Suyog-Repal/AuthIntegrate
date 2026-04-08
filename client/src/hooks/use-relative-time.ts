import { useEffect, useState } from "react";
import { formatRelativeTimeIST } from "@/lib/utils";

/**
 * Hook to provide auto-updating relative time in IST timezone
 * Updates every second to keep the relative time current
 */
export function useRelativeTimeIST(timestamp: string | Date) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    // Set initial value
    setRelativeTime(formatRelativeTimeIST(timestamp));

    // Update every second to keep the relative time current
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTimeIST(timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return relativeTime;
}
