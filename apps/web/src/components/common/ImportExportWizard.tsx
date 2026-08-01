import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog.js";
import { Button } from "../ui/button.js";
import { Input } from "../ui/input.js";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table.js";
import { AlertCircle, CheckCircle2, Download, UploadCloud, Map } from "lucide-react";

export interface ImportField {
  key: string;
  label: string;
  required: boolean;
}

interface ImportExportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  fields: ImportField[];
  onValidate: (file: File, mapping: Record<string, string>) => Promise<any>;
  onCommit: (validData: any[]) => Promise<any>;
  onSuccess: () => void;
  title: string;
}

type Step = "upload" | "mapping" | "validate" | "complete";

export const ImportExportWizard: React.FC<ImportExportWizardProps> = ({
  isOpen,
  onClose,
  fields,
  onValidate,
  onCommit,
  onSuccess,
  title,
}) => {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setMapping({});
    setReport(null);
    setLoading(false);
    setError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);

    try {
      const parsedHeaders = await getFileHeaders(selectedFile);
      setHeaders(parsedHeaders);
      
      // Auto mapping
      const initialMapping: Record<string, string> = {};
      fields.forEach((field) => {
        const matchingHeader = parsedHeaders.find(
          (h) => h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase() === field.label.toLowerCase()
        );
        if (matchingHeader) {
          initialMapping[matchingHeader] = field.key;
        }
      });
      setMapping(initialMapping);
      setStep("mapping");
    } catch (err: any) {
      setError("Failed to read file headers. Please check the file format.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapChange = (header: string, fieldKey: string) => {
    setMapping((prev) => {
      const updated = { ...prev };
      if (!fieldKey) {
        delete updated[header];
      } else {
        updated[header] = fieldKey;
      }
      return updated;
    });
  };

  const handleRunValidation = async () => {
    if (!file) return;

    // Check required fields
    const mappedFields = Object.values(mapping);
    const missingRequired = fields
      .filter((f) => f.required && !mappedFields.includes(f.key))
      .map((f) => f.label);

    if (missingRequired.length > 0) {
      setError(`Please map the following required fields: ${missingRequired.join(", ")}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Invert mapping from { Header: key } to { Key: Header } for convenience
      const invertedMapping: Record<string, string> = {};
      Object.entries(mapping).forEach(([hdr, key]) => {
        invertedMapping[hdr] = key;
      });

      const res = await onValidate(file, invertedMapping);
      setReport(res);
      setStep("validate");
    } catch (err: any) {
      setError(err?.message || "Failed to validate imported rows.");
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!report || !report.validData || report.validData.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      await onCommit(report.validData);
      setStep("complete");
    } catch (err: any) {
      setError(err?.message || "Error committing valid rows to the database.");
    } finally {
      setLoading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!report || !report.errors || report.errors.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(report.errors);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import Errors");
    
    // Write out Excel
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-950/30 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "upload" && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-12 hover:border-zinc-500 transition-colors">
              <UploadCloud className="h-16 w-16 text-zinc-500 mb-4" />
              <p className="text-zinc-300 font-medium mb-1 text-center">Upload your CSV or Excel file</p>
              <p className="text-zinc-500 text-sm mb-6 text-center">Supports .csv, .xls, and .xlsx sheets</p>
              <label className="cursor-pointer">
                <div className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold select-none">
                  Browse Files
                </div>
                <Input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {step === "mapping" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Map className="h-5 w-5 text-indigo-400" />
                <h3 className="text-zinc-300 font-medium">Map columns from file</h3>
              </div>
              <p className="text-zinc-500 text-sm mb-6">
                Link each field in CampusCare to the corresponding header column from your uploaded file.
              </p>

              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Maps to File Column</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => {
                      const currentHeader = Object.keys(mapping).find((h) => mapping[h] === field.key) || "";
                      return (
                        <TableRow key={field.key}>
                          <TableCell className="font-medium text-zinc-300">{field.label}</TableCell>
                          <TableCell className="text-zinc-500">{field.required ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            <select
                              value={currentHeader}
                              onChange={(e) => handleMapChange(e.target.value, field.key)}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">-- Choose Column --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === "validate" && report && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                  <span className="text-zinc-500 text-xs block mb-1">TOTAL ROWS</span>
                  <span className="text-xl font-bold text-zinc-300">{report.totalRows}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                  <span className="text-zinc-500 text-xs block mb-1">VALID ROWS</span>
                  <span className="text-xl font-bold text-green-400">{report.successCount}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                  <span className="text-zinc-500 text-xs block mb-1">INVALID ROWS</span>
                  <span className="text-xl font-bold text-red-400">{report.failureCount}</span>
                </div>
              </div>

              {report.failureCount > 0 && (
                <div className="mb-6 border border-zinc-800 rounded-lg p-4 bg-zinc-950/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-zinc-400 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Row-level Validation Errors
                    </span>
                    <Button variant="outline" size="sm" onClick={downloadErrorReport} className="gap-1.5">
                      <Download className="h-4 w-4" />
                      Download Error Sheet
                    </Button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead className="w-32">Field</TableHead>
                          <TableHead className="w-32">Value</TableHead>
                          <TableHead>Error Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.errors.map((err: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-zinc-400">{err.row}</TableCell>
                            <TableCell className="font-semibold text-zinc-300">{err.field}</TableCell>
                            <TableCell className="text-zinc-500 max-w-[120px] truncate">{String(err.value ?? "")}</TableCell>
                            <TableCell className="text-red-400 text-sm">{err.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {report.successCount > 0 && (
                <div className="p-4 bg-indigo-950/20 border border-indigo-900 rounded-lg">
                  <p className="text-zinc-300 text-sm">
                    Ready to import {report.successCount} valid rows. {report.failureCount > 0 && "Invalid rows will be skipped."}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "complete" && (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4 animate-bounce" />
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">Import Successful!</h3>
              <p className="text-zinc-500 text-center max-w-md">
                Your database has been successfully updated with the imported valid data records.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 border-t border-zinc-800 pt-4">
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleRunValidation} disabled={loading}>
                {loading ? "Parsing..." : "Validate Data"}
              </Button>
            </>
          )}

          {step === "validate" && report && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={handleCommitImport}
                disabled={loading || report.successCount === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "Importing..." : `Commit ${report.successCount} Rows`}
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button
              onClick={() => {
                reset();
                onSuccess();
              }}
            >
              Finish & Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Frontend SheetJS reader helper
function getFileHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return resolve([]);
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return resolve([]);

        const headers: string[] = [];
        const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
        const R = range.s.r; // first row
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          const cell = sheet[cell_ref];
          if (cell && cell.t) {
            headers.push(String(cell.v).trim());
          }
        }
        resolve(headers);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("File reading error"));
    reader.readAsArrayBuffer(file);
  });
}
