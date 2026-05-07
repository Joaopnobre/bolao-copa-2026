import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ResultsClient } from "./ResultsClient";

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const matches = await prisma.match.findMany({
    where: { status: { in: ["LOCKED", "UPCOMING"] } },
    orderBy: [{ sortOrder: "asc" }, { matchDate: "asc" }],
  });

  const champion = await prisma.systemConfig.findUnique({ where: { key: "champion" } });
  const topScorer = await prisma.systemConfig.findUnique({ where: { key: "topScorer" } });

  return (
    <ResultsClient
      matches={JSON.parse(JSON.stringify(matches))}
      officialChampion={champion?.value ?? ""}
      officialScorer={topScorer?.value ?? ""}
    />
  );
}
