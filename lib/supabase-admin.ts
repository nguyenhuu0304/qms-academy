import "server-only";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export class DatabaseConfigurationError extends Error {
  constructor() {
    super("Supabase server environment variables are missing.");
    this.name = "DatabaseConfigurationError";
  }
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new DatabaseConfigurationError();
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_KEY}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  const text = await response.text();
  if (!response.ok) {
    // Never echo database responses or credentials to the browser.
    throw new Error(`Supabase request failed with status ${response.status}.`);
  }

  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Supabase returned an unexpected response.");
  }
}

export function getVietnamDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isDatabaseConfigurationError(error: unknown): boolean {
  return error instanceof DatabaseConfigurationError;
}
