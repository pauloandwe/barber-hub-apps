const MILLISECONDS_PER_MINUTE = 60 * 1000;

function toDate(input: Date | string): Date {
  return typeof input === "string" ? new Date(input) : input;
}

function isInvalid(date: Date): boolean {
  return Number.isNaN(date.getTime());
}

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDate(date: Date | string): string {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return "";
  }
  const day = padTwo(dateObj.getDate());
  const month = padTwo(dateObj.getMonth() + 1);
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTime(date: Date | string): string {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return "";
  }
  const hours = padTwo(dateObj.getHours());
  const minutes = padTwo(dateObj.getMinutes());
  return `${hours}:${minutes}`;
}

export function formatDateTime(date: Date | string): string {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return "";
  }
  const dateStr = formatDate(dateObj);
  const timeStr = formatTime(dateObj);
  return `${dateStr} ${timeStr}`;
}

export function formatUtcDate(date: Date | string): string {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return "";
  }
  const day = padTwo(dateObj.getUTCDate());
  const month = padTwo(dateObj.getUTCMonth() + 1);
  const year = dateObj.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatUtcTime(date: Date | string): string {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return "";
  }
  const hours = padTwo(dateObj.getUTCHours());
  const minutes = padTwo(dateObj.getUTCMinutes());
  return `${hours}:${minutes}`;
}

interface FormatUtcDateTimeOptions {
  connector?: string;
  includeConnector?: boolean;
}

export function formatUtcDateTime(
  date: Date | string,
  options: FormatUtcDateTimeOptions = {}
): string {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return "";
  }

  const { connector = "at", includeConnector = true } = options;
  const dateStr = formatUtcDate(dateObj);
  const timeStr = formatUtcTime(dateObj);

  if (!includeConnector) {
    return `${dateStr} ${timeStr}`;
  }

  const connectorText = connector?.trim();
  if (!connectorText) {
    return `${dateStr} ${timeStr}`;
  }

  return `${dateStr} ${connectorText} ${timeStr}`;
}

export function getUtcDateTimeParts(
  date: Date | string
): { date: string; time: string } {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return { date: "", time: "" };
  }

  return {
    date: formatUtcDate(dateObj),
    time: formatUtcTime(dateObj),
  };
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

export function isToday(date: Date | string): boolean {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return false;
  }
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

export function isPastDate(date: Date | string): boolean {
  const dateObj = toDate(date);
  if (isInvalid(dateObj)) {
    return false;
  }
  return dateObj < new Date();
}

export function isFutureDate(date: Date | string): boolean {
  return !isPastDate(date);
}

export function getDateRange(
  startDate: Date | string,
  endDate: Date | string
): Date[] {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (isInvalid(start) || isInvalid(end)) {
    return [];
  }

  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function getMinimumDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export function convertUtcIsoToLocalDate(dateString: string): Date {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return date;
  }
  return new Date(date.getTime() + date.getTimezoneOffset() * MILLISECONDS_PER_MINUTE);
}
