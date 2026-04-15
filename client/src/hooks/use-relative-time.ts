import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";

/**
 * Hook to provide auto-updating relative time in Mumbai timezone
 * Updates every second to keep the relative time current
 */
export function useRelativeTimeIST(timestamp: string | Date) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    // Set initial value
    setRelativeTime(timeAgo(timestamp));

    // Update every second to keep the relative time current
    const interval = setInterval(() => {
      setRelativeTime(timeAgo(timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return relativeTime;
}
