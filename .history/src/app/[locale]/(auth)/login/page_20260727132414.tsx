"use client";

import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/shared/AuthForms";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tApp = useTranslations("app");

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 bg-[var(--bg)]">
      <div className="w-full max-w-[400px] space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[18px] bg-[var(--primary)] text-white text-2xl font-bold">
            ₽
          </div>
          <h1 className="page-title">{tApp("name")}</h1>
          <p className="page-subtitle">{tApp("tagline")}</p>
        </div>
        <div className="card p-6">
          <p className="font-semibold text-[15px] mb-4">{t("login")}</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
