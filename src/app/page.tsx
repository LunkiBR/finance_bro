import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verifica se o onboarding foi completado
  const profiles = await db.select().from(userProfile).where(eq(userProfile.userId, session.user.id)).limit(1);
  const profile = profiles[0];

  if (!profile?.onboardingCompleto) {
    redirect("/onboarding/welcome");
  }

  redirect("/copiloto");
}
