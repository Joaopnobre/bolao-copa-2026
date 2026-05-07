import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RulesClient } from "./RulesClient";

export default async function RulesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rule = await prisma.rule.findUnique({ where: { key: "main" } });

  return (
    <RulesClient
      content={rule?.content ?? "Regras ainda não definidas."}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
