import PDFDocument from "pdfkit";

export interface PdfSection {
  heading?: string;
  rows: { label: string; value: string | number }[];
}

/**
 * PDF Exporter — uses pdfkit to generate structured report PDFs.
 */
export function exportToPdf(
  title: string,
  subtitle: string,
  sections: PdfSection[],
  generatedAt?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks as unknown as Uint8Array[])));
    doc.on("error", reject);

    // ─── Header ────────────────────────────────────────────────────────────────
    // Banner background
    doc.rect(0, 0, doc.page.width, 90).fill("#1E293B");

    // Title
    doc
      .fillColor("#FFFFFF")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("CampusCare", 50, 20);

    doc
      .fillColor("#94A3B8")
      .fontSize(10)
      .font("Helvetica")
      .text("Enterprise Campus IT Service Management", 50, 46);

    // ─── Report Title ──────────────────────────────────────────────────────────
    doc
      .fillColor("#1E293B")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(title, 50, 110);

    doc
      .fillColor("#64748B")
      .fontSize(10)
      .font("Helvetica")
      .text(subtitle, 50, 134);

    doc
      .fillColor("#94A3B8")
      .fontSize(9)
      .text(`Generated: ${generatedAt ?? new Date().toLocaleString()}`, 50, 150);

    // Divider
    doc.moveTo(50, 170).lineTo(doc.page.width - 50, 170).strokeColor("#E2E8F0").lineWidth(1).stroke();

    let y = 185;

    // ─── Sections ──────────────────────────────────────────────────────────────
    for (const section of sections) {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 50;
      }

      if (section.heading) {
        doc
          .rect(50, y, doc.page.width - 100, 22)
          .fill("#F1F5F9");

        doc
          .fillColor("#1E293B")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(section.heading, 58, y + 6);

        y += 30;
      }

      for (const row of section.rows) {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 50;
        }

        // Label
        doc
          .fillColor("#64748B")
          .fontSize(9)
          .font("Helvetica")
          .text(row.label, 58, y, { width: 180 });

        // Value
        doc
          .fillColor("#0F172A")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(String(row.value), 250, y, { width: 300 });

        // Row separator
        doc
          .moveTo(50, y + 14)
          .lineTo(doc.page.width - 50, y + 14)
          .strokeColor("#F1F5F9")
          .lineWidth(0.5)
          .stroke();

        y += 18;
      }

      y += 12;
    }

    // ─── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc
      .moveTo(50, footerY)
      .lineTo(doc.page.width - 50, footerY)
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .stroke();

    doc
      .fillColor("#94A3B8")
      .fontSize(8)
      .font("Helvetica")
      .text(
        `CampusCare — Confidential Report  |  ${new Date().getFullYear()}`,
        50,
        footerY + 8,
        { align: "center" }
      );

    doc.end();
  });
}
