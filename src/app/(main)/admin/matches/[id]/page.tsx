import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { MatchFormClient } from "../MatchFormClient";

interface Props { params: Promise<{ id: string }> }

export default async function EditMatchPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) notFound();

  return <MatchFormClient match={JSON.parse(JSON.stringify(match))} />;
}
