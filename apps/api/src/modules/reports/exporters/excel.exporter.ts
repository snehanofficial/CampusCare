import ExcelJS from "exceljs";

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

/**
 * Excel Exporter — uses exceljs to generate styled xlsx workbooks.
 */
export async function exportToExcel(sheets: ExcelSheet[], title?: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CampusCare";
  workbook.created = new Date();
  workbook.modified = new Date();

  if (title) {
    workbook.title = title;
  }

  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // dark slate
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    color: { argb: "FFFFFFFF" },
    bold: true,
    size: 11,
  };

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);

    // Add header row
    const headerRow = ws.addRow(sheet.headers);
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF334155" } },
      };
    });

    // Auto-width columns
    ws.columns = sheet.headers.map((h) => ({
      header: h,
      width: Math.max(h.length + 4, 16),
    }));

    // Add data rows
    for (let i = 0; i < sheet.rows.length; i++) {
      const row = ws.addRow(sheet.rows[i]!);
      // Alternate row shading
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        });
      }
      row.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 10 };
        cell.alignment = { vertical: "middle" };
      });
    }

    ws.getRow(1).height = 22;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
