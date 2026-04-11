import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a UTC timestamp to IST (Indian Standard Time, UTC+5:30)
 * and formats it as a relative time string (e.g., "1 sec ago", "5 mins ago")
 * 
 * @param timestamp - The timestamp to format (string or Date)
 * @returns Relative time string with IST consideration
 */
export function formatRelativeTimeIST(timestamp: string | Date): string {
  try {
    // Convert to Date object if string
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

    // Get current time in IST
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

    // Calculate the difference in milliseconds
    const nowIST = new Date(nowUTC.getTime() + istOffset);
    const dateIST = new Date(date.getTime() + istOffset);
    const diffMs = nowIST.getTime() - dateIST.getTime();

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
 * Formats a timestamp to IST date and time (absolute format)
 * Format: "MMM dd, yyyy HH:mm:ss IST" (e.g., "Apr 08, 2026 15:30:45 IST")
 * 
 * @param timestamp - The timestamp to format (string or Date)
 * @returns Formatted date-time string in IST
 */
export function formatAbsoluteTimeIST(timestamp: string | Date): string {
  try {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(date.getTime() + istOffset);

    // Format: MMM dd, yyyy HH:mm:ss IST
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata", // Directly use Asia/Kolkata timezone
    };

    // Use a more direct approach with toLocaleString
    return istDate.toLocaleString("en-US", {
      ...options,
      timeZone: "Asia/Kolkata",
    }) + " IST";
  } catch (error) {
    console.error("Error formatting absolute time:", error);
    return "unknown time";
  }
}
