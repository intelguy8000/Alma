/**
 * Centralized date handling utilities for Medicina del Alma
 *
 * IMPORTANT: Colombia timezone is America/Bogota (UTC-5)
 *
 * These helpers avoid timezone conversion bugs that occur when using:
 * - new Date(dateStr).toISOString() - converts to UTC, can shift day
 * - new Date(dateStr) for display - interprets as UTC, shifts to local
 *
 * ALWAYS use these helpers instead of manual date conversions.
 */

/**
 * Parse a date string to a local Date object without timezone conversion.
 * Handles both YYYY-MM-DD format and ISO strings like "2025-11-26T00:00:00.000Z"
 *
 * @param dateStr - Date string in YYYY-MM-DD or ISO format
 * @returns Date object in local timezone
 *
 * @example
 * parseLocalDate("2025-11-26") // Nov 26, 2025 00:00:00 local time
 * parseLocalDate("2025-11-26T00:00:00.000Z") // Nov 26, 2025 00:00:00 local time
 */
export function parseLocalDate(dateStr: string): Date {
  // If it's an ISO string like "2025-11-26T00:00:00.000Z", extract just the date part
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = cleanDate.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Parse a date string to YYYY-MM-DD format without timezone conversion.
 * Useful for form inputs that need value="YYYY-MM-DD"
 *
 * @param dateStr - Date string in any format
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * parseDateToInput("2025-11-26T00:00:00.000Z") // "2025-11-26"
 * parseDateToInput("2025-11-26") // "2025-11-26"
 */
export function parseDateToInput(dateStr: string): string {
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // If it's an ISO string like "2025-11-26T00:00:00.000Z", extract just the date part
  if (dateStr.includes("T")) {
    return dateStr.split("T")[0];
  }
  // Otherwise, try to parse and format locally
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format using local timezone.
 * Use this instead of new Date().toISOString().split("T")[0]
 *
 * @returns Today's date in YYYY-MM-DD format
 *
 * @example
 * getTodayLocal() // "2025-11-26" (local date)
 */
export function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for database storage (YYYY-MM-DD).
 * Use this when sending dates to the API.
 *
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * formatDBDate(new Date(2025, 10, 26)) // "2025-11-26"
 */
export function formatDBDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a datetime string (with time) to a local Date object.
 * Use for timestamps like createdAt, lastLogin, etc.
 *
 * Note: For timestamps that include time, using new Date() is acceptable
 * because the exact moment in time is what matters, not the local date.
 *
 * @param dateTimeStr - ISO datetime string
 * @returns Date object
 *
 * @example
 * parseDateTime("2025-11-26T14:30:00.000Z") // Converts to local datetime
 */
export function parseDateTime(dateTimeStr: string): Date {
  return new Date(dateTimeStr);
}

/**
 * Parse a time string from API format to HH:mm format.
 * Handles both "HH:mm" and "1970-01-01THH:mm:ss.000Z" formats.
 *
 * @param timeStr - Time string in various formats
 * @returns Time string in HH:mm format
 *
 * @example
 * parseTimeToDisplay("1970-01-01T09:00:00.000Z") // "09:00"
 * parseTimeToDisplay("09:00") // "09:00"
 * parseTimeToDisplay("09:00:00") // "09:00"
 */
export function parseTimeToDisplay(timeStr: string): string {
  if (timeStr.includes("T")) {
    return timeStr.split("T")[1].substring(0, 5);
  }
  return timeStr.substring(0, 5);
}
