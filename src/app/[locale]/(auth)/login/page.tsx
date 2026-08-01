"use client";

import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/shared/AuthForms";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tApp = useTranslations("app");

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-10 bg-background">
      <div className="w-full max-w-[390px] space-y-7">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[20px] bg-[#4A3AFF] text-white text-xl font-bold mb-1">
            ₽
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em]">{tApp("name")}</h1>
          <p className="text-muted text-[14px]">{t("login")}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
