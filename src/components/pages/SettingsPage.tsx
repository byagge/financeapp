"use client";

import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  ThemePreference,
  useTheme,
} from "@/components/providers/ThemeProvider";
import { LocaleFlag } from "@/components/shared/LocaleFlag";
import {
  localeFlagCountry,
  localeNativeName,
  locales,
  type AppLocale,
} from "@/i18n/locales";
import { Link, useRouter } from "@/i18n/routing";
import { useHideBalance } from "@/hooks/useHideBalance";

export function SettingsPage() {
  const t = useTranslations("settings");
  const tProfile = useTranslations("profile");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { update } = useSession();
  const { hidden, setHidden } = useHideBalance();
  const { preference, setPreference } = useTheme();

  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  async function changeLocale(next: AppLocale) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    await update({ locale: next });
    setLangOpen(false);
    router.replace("/settings", { locale: next });
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
          data.error === "invalidPassword"
            ? tProfile("invalidPassword")
            : tCommon("error")
        );
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setPassMsg(tProfile("passwordSaved"));
      setTimeout(() => setPassOpen(false), 800);
    } catch {
      setPassError(tCommon("error"));
    } finally {
      setSavingPass(false);
    }
  }

  const themeLabel =
    preference === "light"
      ? t("themeLight")
      : preference === "dark"
        ? t("themeDark")
        : t("themeSystem");

  const langLabel = localeNativeName[locale];

  const themeOptions: { id: ThemePreference; label: string }[] = [
    { id: "system", label: t("themeSystem") },
    { id: "light", label: t("themeLight") },
    { id: "dark", label: t("themeDark") },
  ];

  return (
    <div className="space-y-5 pb-6 max-w-lg">
      <header className="flex items-center gap-2 pt-1 -ml-1">
        <Link
          href="/more"
          className="w-10 h-10 flex items-center justify-center text-[#16A34A]"
          aria-label={tCommon("back")}
        >
          <ChevronLeft className="w-7 h-7" strokeWidth={2} />
        </Link>
        <h1 className="text-[20px] font-bold tracking-[-0.02em]">{t("title")}</h1>
      </header>

      <section>
        <h2 className="text-[13px] font-semibold text-muted px-1 mb-2">
          {t("interface")}
        </h2>
        <div className="bg-card rounded-[22px] overflow-hidden shadow-card divide-y divide-line">
          <button
            type="button"
            onClick={() => setLangOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-surface"
          >
            <LocaleFlag country={localeFlagCountry[locale]} size={24} />
            <span className="flex-1 font-medium text-[15px]">{t("language")}</span>
            <span className="text-[14px] text-muted">{langLabel}</span>
            <ChevronRight className="w-4 h-4 text-muted shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => setThemeOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-surface"
          >
            <span className="flex-1 font-medium text-[15px]">{t("theme")}</span>
            <span className="text-[14px] text-muted">{themeLabel}</span>
            <ChevronRight className="w-4 h-4 text-muted shrink-0" />
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-muted px-1 mb-2">
          {t("security")}
        </h2>
        <div className="bg-card rounded-[22px] overflow-hidden shadow-card divide-y divide-line">
          <button
            type="button"
            onClick={() => {
              setPassOpen(true);
              setPassMsg("");
              setPassError("");
              setShowCurrent(false);
              setShowNew(false);
              setCurrentPassword("");
              setNewPassword("");
            }}
            className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-surface"
          >
            <span className="flex-1 font-medium text-[15px]">{t("password")}</span>
            <span className="text-[14px] text-muted">{t("change")}</span>
            <ChevronRight className="w-4 h-4 text-muted shrink-0" />
          </button>

          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[15px]">{t("hideBalance")}</div>
              <div className="text-[12px] text-muted mt-0.5">
                {t("hideBalanceHint")}
              </div>
            </div>
            <Toggle checked={hidden} onChange={setHidden} />
          </div>
        </div>
      </section>

      {langOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/40"
            aria-label={tCommon("close")}
            onClick={() => setLangOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-xl rounded-t-[24px] bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-sheet">
            <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4" />
            <div className="font-bold text-[18px] mb-4">{t("language")}</div>
            <div className="space-y-2 max-h-[60dvh] overflow-y-auto">
              {locales.map((code) => {
                const active = locale === code;
                const label = localeNativeName[code];
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => changeLocale(code)}
                    className={`w-full rounded-2xl py-3.5 px-4 font-semibold border flex items-center gap-3 text-left ${
                      active
                        ? "bg-[#16A34A] text-white border-[#16A34A]"
                        : "bg-background border-transparent text-foreground"
                    }`}
                  >
                    <LocaleFlag country={localeFlagCountry[code]} size={26} />
                    <span className="flex-1">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {themeOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/40"
            aria-label={tCommon("close")}
            onClick={() => setThemeOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-xl rounded-t-[24px] bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-sheet">
            <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4" />
            <div className="font-bold text-[18px] mb-4">{t("theme")}</div>
            <div className="space-y-2">
              {themeOptions.map((opt) => {
                const active = preference === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPreference(opt.id);
                      setThemeOpen(false);
                    }}
                    className={`w-full rounded-2xl py-3.5 font-semibold border ${
                      active
                        ? "bg-[#16A34A] text-white border-[#16A34A]"
                        : "bg-background border-transparent text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {passOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/40"
            aria-label={tCommon("close")}
            onClick={() => setPassOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[110] mx-auto max-w-xl rounded-t-[24px] bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-sheet">
            <div className="mx-auto w-10 h-1 rounded-full bg-line-strong mb-4" />
            <div className="font-bold text-[18px] mb-4">{tProfile("changePassword")}</div>
            <form onSubmit={savePassword} className="space-y-3">
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={tProfile("currentPassword")}
                  required
                  autoComplete="current-password"
                  className="w-full bg-background rounded-xl pl-4 pr-12 py-3.5 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={tProfile("newPassword")}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-background rounded-xl pl-4 pr-12 py-3.5 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passError && <p className="text-sm text-[#EF4444]">{passError}</p>}
              {passMsg && <p className="text-sm text-[#16A34A]">{passMsg}</p>}
              <button
                type="submit"
                disabled={savingPass}
                className="w-full rounded-full py-3.5 font-semibold text-white bg-[#16A34A] disabled:opacity-60"
              >
                {savingPass ? "…" : tProfile("savePassword")}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-[51px] h-[31px] rounded-full transition-colors shrink-0 ${
        checked ? "bg-[#16A34A]" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-card shadow transition-transform ${
          checked ? "translate-x-[20px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
