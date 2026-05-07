import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { UserFormClient } from "../UserFormClient";

interface Props { params: Promise<{ id: string }> }

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, username: true, email: true, role: true, isActive: true },
  });
  if (!user) notFound();

  return <UserFormClient user={user} />;
}
