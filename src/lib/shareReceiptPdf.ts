import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function shareOrDownloadPdf(opts: {
  element: HTMLElement;
  fileName: string;
  title: string;
}) {
  const canvas = await html2canvas(opts.element, {
    scale: 2,
    backgroundColor: "#0B0B0B",
    useCORS: true,
    logging: false,
    // Ensure near-invisible node is still painted for capture
    onclone: (_doc, el) => {
      el.style.opacity = "1";
      el.style.position = "static";
      el.style.left = "0";
      el.style.zIndex = "1";
    },
  });

  const imgW = canvas.width;
  const imgH = canvas.height;
  const img = canvas.toDataURL("image/png");
  // A4-ish width in mm; height scales to content
  const pdfW = 210;
  const pdfH = Math.max(297, (imgH / imgW) * pdfW);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pdfW, pdfH],
  });
  pdf.addImage(img, "PNG", 0, 0, pdfW, (imgH / imgW) * pdfW);
  const blob = pdf.output("blob");
  const file = new File([blob], opts.fileName, { type: "application/pdf" });

  const shareData: ShareData = {
    files: [file],
    title: opts.title,
  };

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share(shareData);
      return;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
