import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChallengeFormClient } from "../ChallengeFormClient";

export default async function EditChallengePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const challenge = await prisma.challenge.findUnique({ where: { id: params.id } });
  if (!challenge) redirect("/admin/desafio-do-dia");

  return <ChallengeFormClient challenge={challenge} />;
}
