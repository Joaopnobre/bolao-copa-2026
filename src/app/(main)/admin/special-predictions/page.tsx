import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SpecialPredictionsClient } from "./SpecialPredictionsClient";

export default async function AdminSpecialPredictionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { role: { not: "VIEWER" } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      specialPredictions: {
        where: { type: "TOP_SCORER" },
        select: { value: true },
      },
    },
  });

  const data = users.map((u) => ({
    userId: u.id,
    name: u.name ?? u.username,
    username: u.username,
    topScorer: u.specialPredictions[0]?.value ?? null,
  }));

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <PageHeader
        title="Palpites de Artilheiro"
        subtitle="Corrija o nome do artilheiro palpitado por cada usuário"
        icon="⚽"
      />
      <SpecialPredictionsClient users={data} />
    </div>
  );
}
