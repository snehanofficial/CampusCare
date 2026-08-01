import * as XLSX from "xlsx";
import { z } from "zod";

export interface RowValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ValidationReport<T> {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: RowValidationError[];
  validData: T[];
}

export class ImportExportHelper {
  /**
   * Parse uploaded file buffer (CSV or XLSX) into raw objects.
   */
  static parseBuffer(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }

  /**
   * Maps raw row keys using mapping layout, and validates each row against Zod schema.
   */
  static validateRows<T>(
    rows: any[],
    schema: z.ZodSchema<T>,
    columnMapping?: Record<string, string>
  ): ValidationReport<T> {
    const errors: RowValidationError[] = [];
    const validData: T[] = [];
    
    rows.forEach((row, index) => {
      const rowIndex = index + 1;
      const mappedRow: any = {};

      // If columnMapping exists, map keys. Otherwise use original keys.
      if (columnMapping) {
        Object.entries(columnMapping).forEach(([sourceCol, targetKey]) => {
          if (row[sourceCol] !== undefined) {
            mappedRow[targetKey] = row[sourceCol];
          }
        });
      } else {
        Object.assign(mappedRow, row);
      }

      // Clean empty string values to undefined/null for fields that need validation
      Object.keys(mappedRow).forEach((key) => {
        if (typeof mappedRow[key] === "string" && mappedRow[key].trim() === "") {
          mappedRow[key] = undefined;
        }
      });

      const result = schema.safeParse(mappedRow);
      if (result.success) {
        validData.push(result.data);
      } else {
        result.error.issues.forEach((err) => {
          errors.push({
            row: rowIndex,
            field: err.path.join(".") || "row",
            value: err.path[0] !== undefined ? mappedRow[err.path[0] as string | number] : null,
            message: err.message,
          });
        });
      }
    });

    return {
      totalRows: rows.length,
      successCount: validData.length,
      failureCount: rows.length - validData.length,
      errors,
      validData,
    };
  }

  /**
   * Generates a template file buffer (CSV or XLSX) with defined headers.
   */
  static generateTemplate(headers: string[], format: "csv" | "xlsx"): Buffer {
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    if (format === "csv") {
      const csvString = XLSX.utils.sheet_to_csv(worksheet);
      return Buffer.from(csvString, "utf-8");
    } else {
      return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    }
  }

  /**
   * Generates export buffer for list data in CSV or XLSX format.
   */
  static generateExport(data: any[], format: "csv" | "xlsx"): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");

    if (format === "csv") {
      const csvString = XLSX.utils.sheet_to_csv(worksheet);
      return Buffer.from(csvString, "utf-8");
    } else {
      return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    }
  }
}
