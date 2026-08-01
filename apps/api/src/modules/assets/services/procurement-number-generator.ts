import { prisma } from "../../../database/prisma.js";

export class ProcurementNumberGenerator {
  /**
   * Generates a unique, sequential procurement request number in the format: PR-YYYY-XXXX
   * e.g., PR-2026-0001
   */
  static async generateNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    
    // Find the latest procurement created in the current year
    const lastProcurement = await prisma.procurement.findFirst({
      where: {
        requestNumber: {
          startsWith: `PR-${currentYear}-`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        requestNumber: true,
      },
    });

    let nextNumber = 1;
    if (lastProcurement && lastProcurement.requestNumber) {
      const parts = lastProcurement.requestNumber.split("-");
      const lastNumberStr = parts[parts.length - 1];
      if (lastNumberStr) {
        const lastNumber = parseInt(lastNumberStr, 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    const paddedNumber = String(nextNumber).padStart(4, "0");
    return `PR-${currentYear}-${paddedNumber}`;
  }
}
