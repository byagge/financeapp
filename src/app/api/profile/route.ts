import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/api";

const schema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    locale: z.enum(["ru", "uz"]).optional(),
    currentPassword: z.string().min(1).max(100).optional(),
    newPassword: z.string().min(6).max(100).optional(),
  })
  .refine(
    (data) =>
      !(data.newPassword || data.currentPassword) ||
      (!!data.currentPassword && !!data.newPassword),
    { message: "Password fields required together" }
  );

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const user = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      locale: users.locale,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, authResult.userId))
    .get();

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updates: {
    name?: string;
    locale?: string;
    passwordHash?: string;
  } = {};

  if (parsed.data.name) updates.name = parsed.data.name.trim();
  if (parsed.data.locale) updates.locale = parsed.data.locale;

  if (parsed.data.newPassword && parsed.data.currentPassword) {
    const user = db
      .select()
      .from(users)
      .where(eq(users.id, authResult.userId))
      .get();
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const valid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "invalidPassword" }, { status: 400 });
    }
    updates.passwordHash = await hash(parsed.data.newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  db.update(users).set(updates).where(eq(users.id, authResult.userId)).run();

  const user = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      locale: users.locale,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, authResult.userId))
    .get();

  return NextResponse.json(user);
}
