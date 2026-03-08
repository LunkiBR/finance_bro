import { auth } from "@/auth";

export async function requireAuth(): Promise<{ userId: string; role: string } | Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id, role: session.user.role };
}
