import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userProfile } from "@/db/schema";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Verifica se o onboarding foi completado
  const profiles = await db.select().from(userProfile).limit(1);
  const profile = profiles[0];

  if (!profile?.onboardingCompleto) {
    redirect("/onboarding/welcome");
  }

  redirect("/copiloto");
}
