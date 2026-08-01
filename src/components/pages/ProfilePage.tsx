"use client";

import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";

export function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { data: session, update } = useSession();

  const [name, setName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  const email = session?.user?.email || "";

  function openEditName() {
    setDraft(name);
    setError("");
    setMsg("");
    setEditOpen(true);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (!next) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (!res.ok) throw new Error("fail");
      await update({ name: next });
      setName(next);
      setMsg(t("saved"));
      setTimeout(() => setEditOpen(false), 600);
    } catch {
      setError(tCommon("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-6 max-w-lg">
      <header className="relative flex items-center justify-center pt-1">
        <Link
          href="/more"
          className="absolute left-0 w-10 h-10 flex items-center justify-center text-[#16A34A] -ml-1"
          aria-label={tCommon("back")}
        >
          <ChevronLeft className="w-7 h-7" strokeWidth={2} />
        </Link>
        <h1 className="text-[18px] font-semibold tracking-[-0.02em]">
          {t("title")}
        </h1>
      </header>

      <div className="flex flex-col items-center text-center pt-2 pb-1">
        <div className="w-24 h-24 rounded-full bg-line-strong text-muted flex items-center justify-center">
          <UserRound className="w-12 h-12" strokeWidth={1.5} />
        </div>
        <div className="mt-4 text-[15px] font-semibold tracking-wide uppercase text-muted-strong px-4">
          {name || "—"}
        </div>
      </div>

      <div className="bg-card rounded-[22px] overflow-hidden shadow-card divide-y divide-line">
        <button
          type="button"
          onClick={openEditName}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-muted">{t("changeName")}</div>
            <div className="font-semibold text-[16px] mt-0.5 truncate">
              {name || "—"}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted shrink-0" />
        </button>

        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-muted">E-mail</div>
            <div className="font-semibold text-[16px] mt-0.5 truncate">
              {email || "—"}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/40"
            aria-label={tCommon("close")}
            onClick={() => setEditOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-xl rounded-t-[24px] bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-sheet">
            <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4" />
            <div className="font-bold text-[18px] mb-4">{t("changeName")}</div>
            <form onSubmit={saveName} className="space-y-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                required
                autoFocus
                className="w-full bg-background rounded-xl px-4 py-3.5 outline-none font-medium"
              />
              {error && <p className="text-sm text-[#EF4444]">{error}</p>}
              {msg && <p className="text-sm text-[#16A34A]">{msg}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full py-3.5 font-semibold text-white bg-[#16A34A] disabled:opacity-60"
              >
                {saving ? "…" : t("saveName")}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
