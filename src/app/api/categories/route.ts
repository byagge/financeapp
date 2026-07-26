import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireUser } from "@/lib/api";
import { nowISO } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const items = db
    .select()
    .from(categories)
    .where(eq(categories.userId, authResult.userId))
    .orderBy(asc(categories.name))
    .all();

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const authResult = await requireUser();
  if ("error" in authResult) return authResult.error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const row = {
    id: nanoid(),
    userId: authResult.userId,
    name: parsed.data.name.trim(),
    createdAt: nowISO(),
  };
  db.insert(categories).values(row).run();
  return NextResponse.json(row, { status: 201 });
}
