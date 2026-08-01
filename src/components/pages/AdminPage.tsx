"use client";

import { Plus, Shield, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { fetchJson } from "@/lib/types";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
  createdAt: string;
};

export function AdminPage() {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const router = useRouter();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchJson<{ items: AdminUser[] }>("/api/admin/users"),
    enabled: session?.user?.role === "admin",
  });

  const create = useMutation({
    mutationFn: () =>
      fetchJson("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setPassword("");
      setOpen(false);
      setError("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => {
      setError(err.message === "exists" ? tAuth("exists") : tCommon("error"));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  if (status === "loading" || session?.user?.role !== "admin") {
    return (
      <div className="py-16 text-center text-muted">{tCommon("loading")}</div>
    );
  }

  const items = data?.items || [];

  return (
    <div className="space-y-5 max-w-2xl pb-4">
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t("title")}
          </h1>
          <p className="text-[13px] text-muted mt-1">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 bg-primary text-white rounded-full px-4 py-2 text-sm font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t("create")}
        </button>
      </div>

      {open && (
        <form
          className="bg-card rounded-[22px] p-4 space-y-3 shadow-card overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            create.mutate();
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tAuth("name")}
            required
            className="w-full min-w-0 bg-background rounded-xl px-4 py-3 outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tAuth("email")}
            required
            className="w-full min-w-0 bg-background rounded-xl px-4 py-3 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tAuth("password")}
            required
            minLength={6}
            className="w-full min-w-0 bg-background rounded-xl px-4 py-3 outline-none"
          />
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              className="rounded-xl px-4 py-3 font-semibold text-muted-strong bg-background"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-xl px-4 py-3 font-semibold text-white bg-primary disabled:opacity-60"
            >
              {create.isPending ? "…" : t("save")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="bg-card rounded-[24px] p-8 text-center text-muted">…</div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-[24px] p-8 text-center text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="bg-card rounded-[24px] divide-y divide-line overflow-hidden shadow-card">
          {items.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.name}</div>
                <div className="text-xs text-muted truncate">{u.email}</div>
              </div>
              <span
                className={`text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0 ${
                  u.role === "admin"
                    ? "bg-primary-soft text-primary"
                    : "bg-background text-muted-strong"
                }`}
              >
                {u.role === "admin" ? t("roleAdmin") : t("roleUser")}
              </span>
              {u.id !== session.user.id && (
                <button
                  type="button"
                  className="p-2 rounded-xl hover:bg-danger-soft text-[#EF4444] shrink-0"
                  onClick={() => {
                    if (confirm(t("confirmDelete"))) remove.mutate(u.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
