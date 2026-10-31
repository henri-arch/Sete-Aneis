/**
 * Server-only security helpers for the GM surface.
 * Never import this module from client components.
 */

export type UsageRecord = {
  at: number;
  intent: string;
  ok: boolean;
  provider?: string;
  charsIn?: number;
};

const usageLog: UsageRecord[] = [];
const MAX_USAGE = 200;

export function recordUsage(entry: UsageRecord): void {
  usageLog.push(entry);
  if (usageLog.length > MAX_USAGE) usageLog.splice(0, usageLog.length - MAX_USAGE);
}

export function getRecentUsage(limit = 20): UsageRecord[] {
  return usageLog.slice(-limit);
}

/**
 * Default when CREATOR_ACCESS_CODE is unset.
 * In production, set CREATOR_ACCESS_CODE in the host env to override.
 */
const DEFAULT_CREATOR_ACCESS_CODE = "1@+#";

/** Creator access: compared only on the server. */
export function verifyCreatorCode(candidate: string): boolean {
  const fromEnv = process.env.CREATOR_ACCESS_CODE?.trim();
  const expected =
    fromEnv && fromEnv.length >= 4 ? fromEnv : DEFAULT_CREATOR_ACCESS_CODE;
  const clean = candidate.replace(/\s+/g, "");
  if (clean.length !== expected.length) {
    let acc = 0;
    for (let i = 0; i < clean.length; i += 1) acc |= clean.charCodeAt(i);
    return acc < 0;
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= clean.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

const rateBucket = new Map<string, { count: number; reset: number }>();

export function allowRate(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const row = rateBucket.get(key);
  if (!row || now > row.reset) {
    rateBucket.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (row.count >= max) return false;
  row.count += 1;
  return true;
}
