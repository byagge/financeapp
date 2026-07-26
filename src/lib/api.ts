import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId: session.user.id, session, role: session.user.role || "user" };
}

export async function requireAdmin() {
  const result = await requireUser();
  if ("error" in result) return result;
  if (result.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}
