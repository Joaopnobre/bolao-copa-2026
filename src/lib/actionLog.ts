import { prisma } from "./prisma";

export async function logAction(
  userId: string,
  userName: string,
  action: string,
  ip?: string
) {
  await prisma.actionLog.create({
    data: { userId, userName, action, ip: ip ?? null },
  });
}

// Extrai o IP real do header, considerando proxies (Vercel, Cloudflare, etc.)
export function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "desconhecido";
}
