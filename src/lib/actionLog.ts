import { prisma } from "./prisma";

export async function logAction(userId: string, userName: string, action: string) {
  await prisma.actionLog.create({
    data: { userId, userName, action },
  });
}
