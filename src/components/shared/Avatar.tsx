"use client";

import { initials } from "@/lib/utils";

export function Avatar({
  name,
  color,
  size = 44,
  selected,
  onClick,
}: {
  name: string;
  color?: string | null;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="relative shrink-0 rounded-full flex items-center justify-center text-white font-semibold select-none overflow-hidden"
      style={{
        width: size,
        height: size,
        background: color || "#A8B5AE",
        fontSize: size * 0.3,
        boxShadow: selected
          ? "0 0 0 2px color-mix(in srgb, var(--primary) 35%, transparent), 0 0 0 3.5px var(--ink)"
          : undefined,
      }}
      aria-label={name}
    >
      {initials(name)}
    </Tag>
  );
}
