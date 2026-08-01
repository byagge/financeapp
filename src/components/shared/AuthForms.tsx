"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";

const field =
  "w-full bg-card rounded-[22px] px-4 py-3.5 outline-none shadow-card border border-line text-foreground";
const labelCls = "text-xs text-muted mb-1.5 font-medium";
const btn =
  "w-full bg-[#4A3AFF] text-white rounded-full py-[17px] font-semibold disabled:opacity-60 shadow-[0_12px_28px_rgba(74,58,255,0.35)]";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        setLoading(false);
        if (res?.error) {
          setError(t("invalid"));
          return;
        }
        router.push("/");
        router.refresh();
      }}
    >
      <label className="block">
        <div className={labelCls}>{t("email")}</div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <div className={labelCls}>{t("password")}</div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </label>
      {error && <p className="text-sm text-[#EF4444]">{error}</p>}
      <button type="submit" disabled={loading} className={btn}>
        {t("loginAction")}
      </button>
    </form>
  );
}
