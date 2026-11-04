import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Vercel Cron envia "Authorization: Bearer <CRON_SECRET>". */
export function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
