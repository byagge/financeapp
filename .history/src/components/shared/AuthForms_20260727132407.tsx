"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";

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
        <span className="field-label">{t("email")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />
      </label>
      <label className="block">
        <span className="field-label">{t("password")}</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
        />
      </label>
      {error && <p className="text-[14px] text-expense">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {t("loginAction")}
      </button>
    </form>
  );
}
