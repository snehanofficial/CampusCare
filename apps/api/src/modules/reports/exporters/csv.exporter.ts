/**
 * CSV Exporter — pure Node.js, no external dependency.
 * Converts an array of objects into CSV buffer.
 */
export function exportToCsv(data: Record<string, unknown>[], title?: string): Buffer {
  if (data.length === 0) {
    return Buffer.from(`${title ? `# ${title}\n` : ""}No data available\n`, "utf-8");
  }

  const headers = Object.keys(data[0]!);

  const escape = (val: unknown): string => {
    const str = val === null || val === undefined ? "" : String(val);
    // Wrap in quotes if it contains comma, newline, or double-quote
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows: string[] = [];
  if (title) {
    rows.push(`# ${title}`);
  }
  rows.push(headers.map(escape).join(","));
  for (const row of data) {
    rows.push(headers.map((h) => escape(row[h])).join(","));
  }

  return Buffer.from(rows.join("\n"), "utf-8");
}

export function flattenForCsv(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
        result[`${key}_${subKey}`] = subVal;
      }
    } else if (Array.isArray(value)) {
      result[key] = value.join("; ");
    } else {
      result[key] = value;
    }
  }
  return result;
}
