/** Draw a simple share banner (check + amount + type) and share as PNG + text. */

function drawCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#22C55E";
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(6, r * 0.14);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.moveTo(cx - r * 0.38, cy + r * 0.02);
  ctx.lineTo(cx - r * 0.08, cy + r * 0.32);
  ctx.lineTo(cx + r * 0.42, cy - r * 0.28);
  ctx.stroke();
}

function drawBanner(opts: {
  amount: string;
  typeLabel: string;
}): HTMLCanvasElement {
  const w = 1080;
  const h = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  // Background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#0B0B0B");
  grad.addColorStop(0.55, "#12141A");
  grad.addColorStop(1, "#1A1030");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft pattern accents
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let i = 0; i < 14; i++) {
    const x = 80 + (i % 7) * 140;
    const y = 90 + Math.floor(i / 7) * 160;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18, y + 42);
    ctx.lineTo(x, y + 30);
    ctx.lineTo(x - 18, y + 42);
    ctx.closePath();
    ctx.fill();
  }

  drawCheck(ctx, w / 2, 340, 110);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 92px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.amount, w / 2, 560, w - 120);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 48px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(opts.typeLabel, w / 2, 660, w - 120);

  return canvas;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))),
      "image/png"
    );
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function shareTransactionBanner(opts: {
  amount: string;
  typeLabel: string;
  text: string;
  title: string;
  fileName?: string;
}) {
  const canvas = drawBanner({
    amount: opts.amount,
    typeLabel: opts.typeLabel,
  });
  const blob = await canvasToPngBlob(canvas);
  const fileName = opts.fileName || "transaction.png";
  const file = new File([blob], fileName, { type: "image/png" });

  const withFiles: ShareData = {
    files: [file],
    title: opts.title,
    text: opts.text,
  };
  const textOnly: ShareData = {
    title: opts.title,
    text: opts.text,
  };

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share(withFiles);
      return;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
  }

  try {
    if (navigator.share) {
      await navigator.share(textOnly);
      downloadBlob(blob, fileName);
      return;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(opts.text);
  } catch {
    /* ignore */
  }
  downloadBlob(blob, fileName);
}
