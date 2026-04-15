import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates relative time between a given timestamp and now in Mumbai timezone (IST)
 * Handles multiple timestamp formats robustly
 * 
 * @param timestamp - The timestamp (string or Date) from backend
 * @returns Relative time string (e.g., "1 sec ago", "5 mins ago")
 */
export function formatRelativeTimeIST(timestamp: string | Date): string {
  try {
    // ✅ Parse timestamp robustly, handling multiple formats
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "string") {
      // ✅ CRITICAL FIX: Parse MySQL datetime format correctly
      // Format: "2026-04-15 15:30:45" (IST from CONVERT_TZ)
      // Replace space with 'T' to create ISO-like format for reliable parsing
      const isoFormat = timestamp.replace(" ", "T");
      date = new Date(isoFormat);
      
      // Fallback: if ISO parsing fails, try direct parsing
      if (isNaN(date.getTime())) {
        date = new Date(timestamp);
      }
      
      // Last resort: try to parse manually
      if (isNaN(date.getTime())) {
        const parts = timestamp.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
          date = new Date(
            parseInt(parts[1]),
            parseInt(parts[2]) - 1,
            parseInt(parts[3]),
            parseInt(parts[4]),
            parseInt(parts[5]),
            parseInt(parts[6])
          );
        } else {
          throw new Error("Invalid timestamp format");
        }
      }
    } else {
      throw new Error("Invalid timestamp type");
    }
    
    // ✅ Validate date was parsed correctly
    if (isNaN(date.getTime())) {
      console.error("Failed to parse timestamp:", timestamp);
      return "unknown time";
    }
    
    // ✅ Get current time
    const now = new Date();
    
    // ✅ Calculate difference in seconds
    // This works correctly because both dates are in the same reference frame
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) {
      // Future timestamp (shouldn't happen, but handle gracefully)
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
    // ✅ Parse timestamp robustly, handling multiple formats
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "string") {
      // ✅ CRITICAL FIX: Parse MySQL datetime format correctly
      // Format: "2026-04-15 15:30:45" (IST from CONVERT_TZ)
      // Replace space with 'T' to create ISO-like format for reliable parsing
      const isoFormat = timestamp.replace(" ", "T");
      date = new Date(isoFormat);
      
      // Fallback: if ISO parsing fails, try direct parsing
      if (isNaN(date.getTime())) {
        date = new Date(timestamp);
      }
      
      // Last resort: try to parse manually
      if (isNaN(date.getTime())) {
        const parts = timestamp.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
          date = new Date(
            parseInt(parts[1]),
            parseInt(parts[2]) - 1,
            parseInt(parts[3]),
            parseInt(parts[4]),
            parseInt(parts[5]),
            parseInt(parts[6])
          );
        } else {
          throw new Error("Invalid timestamp format");
        }
      }
    } else {
      throw new Error("Invalid timestamp type");
    }
    
    // ✅ Validate date was parsed correctly
    if (isNaN(date.getTime())) {
      console.error("Failed to parse absolute timestamp:", timestamp);
      return "unknown time";
    }

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
    // ✅ Parse timestamp robustly, handling multiple formats
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "string") {
      // ✅ CRITICAL FIX: Parse MySQL datetime format correctly
      // Format: "2026-04-15 15:30:45" (IST from CONVERT_TZ)
      // Replace space with 'T' to create ISO-like format for reliable parsing
      const isoFormat = timestamp.replace(" ", "T");
      date = new Date(isoFormat);
      
      // Fallback: if ISO parsing fails, try direct parsing
      if (isNaN(date.getTime())) {
        date = new Date(timestamp);
      }
      
      // Last resort: try to parse manually
      if (isNaN(date.getTime())) {
        const parts = timestamp.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
          date = new Date(
            parseInt(parts[1]),
            parseInt(parts[2]) - 1,
            parseInt(parts[3]),
            parseInt(parts[4]),
            parseInt(parts[5]),
            parseInt(parts[6])
          );
        } else {
          throw new Error("Invalid timestamp format");
        }
      }
    } else {
      throw new Error("Invalid timestamp type");
    }
    
    // ✅ Validate date was parsed correctly
    if (isNaN(date.getTime())) {
      console.error("Failed to parse export timestamp:", timestamp);
      return "unknown time";
    }

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
