import { auth } from "@/auth";

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function requireAuth(): Promise<{ userId: string; role: string } | Response> {
  const session = await auth();
  if (!session?.user?.id || !isValidUUID(session.user.id)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id, role: session.user.role };
}
