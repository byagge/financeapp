"use client";

import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils";

export function ProfilePage() {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { data: session, update } = useSession();
  const locale = useLocale();
  const router = useRouter();

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [nameError, setNameError] = useState("");
  const [passError, setPassError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  const email = session?.user?.email || "";
  const isAdmin = session?.user?.role === "admin";

  async function changeLocale(next: "ru" | "uz") {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    await update({ locale: next });
    router.replace("/profile", { locale: next });
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameError("");
    setNameMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("fail");
      await update({ name: name.trim() });
      setNameMsg(t("saved"));
    } catch {
      setNameError(tCommon("error"));
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPass(true);
    setPassError("");
    setPassMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPassError(
          data.error === "invalidPassword" ? t("invalidPassword") : tCommon("error")
        );
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setPassMsg(t("passwordSaved"));
    } catch {
      setPassError(tCommon("error"));
    } finally {
      setSavingPass(false);
    }
  }

  return (
    <div className="space-y-5 max-w-lg pb-4 animate-fade-in">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
          <User className="w-8 h-8" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-[var(--muted)] mb-0.5">{t("account")}</div>
          <div className="font-bold text-[18px] truncate">{session?.user?.name || "—"}</div>
          <div className="text-[14px] text-[var(--muted)] truncate">{email}</div>
        </div>
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          className="card p-5 flex items-center gap-4 hover:bg-[var(--bg)] transition-colors"
        >
          <div className="w-12 h-12 rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-[15px]">{t("adminPanel")}</div>
            <div className="text-[13px] text-[var(--muted)]">{t("adminHint")}</div>
          </div>
        </Link>
      )}

      <form onSubmit={saveName} className="card p-5 space-y-4">
        <SectionTitle className="!mb-0">{t("changeName")}</SectionTitle>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="field"
        />
        {nameError && <p className="text-[14px] text-expense">{nameError}</p>}
        {nameMsg && <p className="text-[14px] text-income">{nameMsg}</p>}
        <button type="submit" disabled={savingName} className="btn-primary w-full">
          {savingName ? "…" : t("saveName")}
        </button>
      </form>

      <form onSubmit={savePassword} className="card p-5 space-y-4">
        <SectionTitle className="!mb-0">{t("changePassword")}</SectionTitle>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t("currentPassword")}
          required
          className="field"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t("newPassword")}
          required
          minLength={6}
          className="field"
        />
        {passError && <p className="text-[14px] text-expense">{passError}</p>}
        {passMsg && <p className="text-[14px] text-income">{passMsg}</p>}
        <button type="submit" disabled={savingPass} className="btn-primary w-full">
          {savingPass ? "…" : t("savePassword")}
        </button>
      </form>

      <div className="card p-5 space-y-3">
        <SectionTitle className="!mb-0">{t("language")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => changeLocale("ru")}
            className={cn(
              "min-h-[52px] rounded-[var(--radius-md)] font-semibold text-[15px] border-2 transition-colors",
              locale === "ru"
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                : "border-[var(--line)] bg-[var(--card)]"
            )}
          >
            {t("russian")}
          </button>
          <button
            type="button"
            onClick={() => changeLocale("uz")}
            className={cn(
              "min-h-[52px] rounded-[var(--radius-md)] font-semibold text-[15px] border-2 transition-colors",
              locale === "uz"
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                : "border-[var(--line)] bg-[var(--card)]"
            )}
          >
            {t("uzbek")}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
        className="w-full card py-4 font-semibold text-[15px] text-expense hover:bg-expense-soft transition-colors"
      >
        {tAuth("logout")}
      </button>
    </div>
  );
}
