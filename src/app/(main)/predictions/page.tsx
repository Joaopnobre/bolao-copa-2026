import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PredictionsClient } from "./PredictionsClient";

export default async function PredictionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const matches = await prisma.match.findMany({
    orderBy: [{ sortOrder: "asc" }, { matchDate: "asc" }],
  });

  const userPredictions = await prisma.prediction.findMany({
    where: { userId: session.user.id },
  });

  return (
    <PredictionsClient
      matches={JSON.parse(JSON.stringify(matches))}
      userPredictions={JSON.parse(JSON.stringify(userPredictions))}
      isViewer={session.user.role === "VIEWER"}
    />
  );
}
