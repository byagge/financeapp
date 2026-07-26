"use client";

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#F5F6FA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-[20px] bg-[#4A3AFF] text-white text-xl font-bold flex items-center justify-center shadow-[0_12px_28px_rgba(74,58,255,0.3)]">
            ₽
          </div>
          <span className="absolute -inset-2 rounded-[24px] border-2 border-[#4A3AFF]/25 border-t-[#4A3AFF] animate-spin" />
        </div>
      </div>
    </div>
  );
}
