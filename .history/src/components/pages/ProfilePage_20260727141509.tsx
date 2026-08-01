"use client";

import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";

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
    <div className="space-y-5 max-w-lg pb-4">
      <h1 className="text-[22px] font-bold tracking-[-0.02em] pt-1">{t("title")}</h1>

      <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_24px_rgba(17,24,39,0.04)] flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#EEECFF] text-[#4A3AFF] flex items-center justify-center">
          <User className="w-7 h-7" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-[#9CA3AF] mb-1">{t("account")}</div>
          <div className="font-bold text-lg truncate">{session?.user?.name || "—"}</div>
          <div className="text-sm text-[#9CA3AF] truncate">{email}</div>
        </div>
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-3 bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(17,24,39,0.04)] hover:bg-[#F8F9FC] transition-colors"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EEECFF] text-[#4A3AFF] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">{t("adminPanel")}</div>
            <div className="text-[12px] text-[#9CA3AF]">{t("adminHint")}</div>
          </div>
        </Link>
      )}

      <form
        onSubmit={saveName}
        className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(17,24,39,0.04)] space-y-3"
      >
        <div className="font-semibold">{t("changeName")}</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-[#F5F6FA] rounded-xl px-4 py-3 outline-none"
        />
        {nameError && <p className="text-sm text-[#EF4444]">{nameError}</p>}
        {nameMsg && <p className="text-sm text-[#16A34A]">{nameMsg}</p>}
        <button
          type="submit"
          disabled={savingName}
          className="w-full rounded-full py-3 font-semibold text-white bg-[#4A3AFF] disabled:opacity-60"
        >
          {savingName ? "…" : t("saveName")}
        </button>
      </form>

      <form
        onSubmit={savePassword}
        className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(17,24,39,0.04)] space-y-3"
      >
        <div className="font-semibold">{t("changePassword")}</div>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t("currentPassword")}
          required
          className="w-full bg-[#F5F6FA] rounded-xl px-4 py-3 outline-none"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t("newPassword")}
          required
          minLength={6}
          className="w-full bg-[#F5F6FA] rounded-xl px-4 py-3 outline-none"
        />
        {passError && <p className="text-sm text-[#EF4444]">{passError}</p>}
        {passMsg && <p className="text-sm text-[#16A34A]">{passMsg}</p>}
        <button
          type="submit"
          disabled={savingPass}
          className="w-full rounded-full py-3 font-semibold text-white bg-[#4A3AFF] disabled:opacity-60"
        >
          {savingPass ? "…" : t("savePassword")}
        </button>
      </form>

      <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(17,24,39,0.04)] space-y-3">
        <div className="font-semibold">{t("language")}</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => changeLocale("ru")}
            className={`rounded-2xl py-3.5 font-medium border ${
              locale === "ru"
                ? "bg-[#4A3AFF] text-white border-[#4A3AFF]"
                : "bg-[#F5F6FA] border-transparent"
            }`}
          >
            {t("russian")}
          </button>
          <button
            type="button"
            onClick={() => changeLocale("uz")}
            className={`rounded-2xl py-3.5 font-medium border ${
              locale === "uz"
                ? "bg-[#4A3AFF] text-white border-[#4A3AFF]"
                : "bg-[#F5F6FA] border-transparent"
            }`}
          >
            {t("uzbek")}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
        className="w-full bg-white text-[#EF4444] rounded-full py-4 font-semibold shadow-[0_8px_24px_rgba(17,24,39,0.04)]"
      >
        {tAuth("logout")}
      </button>
    </div>
  );
}
