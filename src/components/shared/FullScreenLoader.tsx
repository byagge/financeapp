"use client";

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      <div className="flex items-center gap-2" aria-hidden>
        <span className="loader-dot" />
        <span className="loader-dot [animation-delay:160ms]" />
        <span className="loader-dot [animation-delay:320ms]" />
      </div>
      <span className="sr-only">…</span>
    </div>
  );
}
