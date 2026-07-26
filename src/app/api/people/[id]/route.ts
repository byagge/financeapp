import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { people } from "@/db/schema";
import { requireUser } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarColor: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;
  const { id } = await ctx.params;

  const existing = db
    .select()
    .from(people)
    .where(and(eq(people.id, id), eq(people.userId, authResult.userId)))
    .get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  db.update(people)
    .set(parsed.data)
    .where(and(eq(people.id, id), eq(people.userId, authResult.userId)))
    .run();

  return NextResponse.json(
    db.select().from(people).where(eq(people.id, id)).get()
  );
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;
  const { id } = await ctx.params;

  const existing = db
    .select()
    .from(people)
    .where(and(eq(people.id, id), eq(people.userId, authResult.userId)))
    .get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.delete(people)
    .where(and(eq(people.id, id), eq(people.userId, authResult.userId)))
    .run();

  return NextResponse.json({ ok: true });
}
