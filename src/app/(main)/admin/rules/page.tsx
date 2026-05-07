import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminRulesClient } from "./AdminRulesClient";

export default async function AdminRulesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const rule = await prisma.rule.findUnique({ where: { key: "main" } });

  return <AdminRulesClient content={rule?.content ?? ""} />;
}
