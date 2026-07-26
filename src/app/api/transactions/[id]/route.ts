import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { requireUser } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  income: z.number().min(0).optional(),
  expense: z.number().min(0).optional(),
  note: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  personId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;
  const { id } = await ctx.params;

  const row = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .get();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;
  const { id } = await ctx.params;

  const existing = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  db.update(transactions)
    .set(parsed.data)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .run();

  const updated = db.select().from(transactions).where(eq(transactions.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;
  const { id } = await ctx.params;

  const existing = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .get();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, authResult.userId)))
    .run();

  return NextResponse.json({ ok: true });
}
