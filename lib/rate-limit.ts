import { NextRequest } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    startTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(req: NextRequest, limit: number = 3, windowMs: number = 3600000) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
  const now = Date.now();

  if (!store[ip]) {
    store[ip] = { count: 1, startTime: now };
    return { success: true };
  }

  const userData = store[ip];

  if (now - userData.startTime > windowMs) {
    userData.count = 1;
    userData.startTime = now;
    return { success: true };
  }

  if (userData.count >= limit) {
    return { success: false, retryAfter: Math.ceil((userData.startTime + windowMs - now) / 1000) };
  }

  userData.count += 1;
  return { success: true };
}
