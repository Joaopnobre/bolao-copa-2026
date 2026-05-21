import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChallengeFormClient } from "../ChallengeFormClient";

export default async function NewChallengePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  return <ChallengeFormClient />;
}
