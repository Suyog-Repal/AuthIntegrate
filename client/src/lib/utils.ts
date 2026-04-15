import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates relative time between a given timestamp and now in Mumbai timezone (IST)
 * Backend sends IST timestamps in MySQL format (YYYY-MM-DD HH:MM:SS), not ISO format
 * This ensures we don't apply conflicting timezone conversions
 * 
 * @param timestamp - The timestamp to format (string or Date) - should be IST from backend
 * @returns Relative time string (e.g., "1 sec ago", "5 mins ago")
 */
export function formatRelativeTimeIST(timestamp: string | Date): string {
  try {
    // ✅ CRITICAL: Parse IST timestamp correctly
    // Backend sends MySQL datetime format: "2026-04-15 10:30:00" (already IST)
    // JavaScript Date() will parse this as local time, which is correct
    // DO NOT apply any timezone offset
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    
    // ✅ CRITICAL: Get current time in IST for comparison
    // Use same logic as backend: convert NOW() to IST for accurate comparison
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata", // IST
    };
    const nowIST = now.toLocaleString("en-CA", options); // "YYYY-MM-DD HH:MM:SS"
    const nowISTDate = new Date(nowIST);

    // Calculate difference using IST-aware timestamps
    const diffMs = nowISTDate.getTime() - date.getTime();

    // Handle edge cases
    if (diffMs < 0) {
      return "just now";
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Format based on time elapsed
    if (diffSeconds < 1) {
      return "just now";
    } else if (diffSeconds < 60) {
      return diffSeconds === 1 ? "1 sec ago" : `${diffSeconds} secs ago`;
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? "1 min ago" : `${diffMinutes} mins ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
    }
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "unknown time";
  }
}

/**
 * Formats a timestamp to Mumbai timezone date and time (absolute format)
 * Format: "dd MMM yyyy, HH:mm:ss" (e.g., "15 Apr 2026, 15:30:45")
 * All times are in Mumbai timezone (UTC+5:30)
 * 
 * ✅ CRITICAL: Backend sends timestamps already converted to IST by MySQL
 * We DON'T apply additional timezone conversion - just format for display
 * 
 * @param timestamp - The timestamp to format (string or Date)
 * @returns Formatted date-time string in Mumbai timezone
 */
export function formatAbsoluteTimeIST(timestamp: string | Date): string {
  try {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

    // ✅ CRITICAL FIX: Since backend sends IST timestamps from MySQL,
    // we parse them as local time and format using Asia/Kolkata timezone
    // This ensures consistent display across browsers
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata", // Mumbai timezone (UTC+5:30)
    };

    // Use toLocaleString with Mumbai timezone for display
    return date.toLocaleString("en-US", options) + " IST";
  } catch (error) {
    console.error("Error formatting absolute time:", error);
    return "unknown time";
  }
}

/**
 * Formats a timestamp to Mumbai timezone date and time for export (Excel/PDF)
 * Format: "dd MMM yyyy, HH:mm:ss" (e.g., "08 Apr 2026, 15:30:45")
 * All times are in Mumbai timezone (UTC+5:30)
 * 
 * @param timestamp - The timestamp to format (string or Date)
 * @returns Formatted date-time string in Mumbai timezone for exports
 */
export function formatTimestampForExport(timestamp: string | Date): string {
  try {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata", // Mumbai timezone (UTC+5:30)
    };

    return date.toLocaleString("en-US", options) + " IST";
  } catch (error) {
    console.error("Error formatting timestamp for export:", error);
    return "unknown time";
  }
}

/**
 * Formats current date/time to Mumbai timezone (used for generated timestamps in exports)
 * Format: "dd MMM yyyy, HH:mm:ss"
 * All times are in Mumbai timezone (UTC+5:30)
 * 
 * @returns Current date-time string in Mumbai timezone for exports
 */
export function getCurrentTimeIST(): string {
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata", // Mumbai timezone (UTC+5:30)
    };

    return now.toLocaleString("en-US", options) + " IST";
  } catch (error) {
    console.error("Error getting current time in IST:", error);
    return "unknown time";
  }
}
