import { prisma } from "../../../database/prisma.js";

export class AssetCodeGenerator {
  /**
   * Generates a unique, sequential asset code in the format: AST-YYYY-XXXX
   * e.g., AST-2026-0001
   */
  static async generateCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    
    // Find the latest asset created in the current year, including inactive/soft-deleted ones
    const lastAsset = await prisma.asset.findFirst({
      where: {
        assetCode: {
          startsWith: `AST-${currentYear}-`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        assetCode: true,
      },
    });

    let nextNumber = 1;
    if (lastAsset && lastAsset.assetCode) {
      const parts = lastAsset.assetCode.split("-");
      const lastNumberStr = parts[parts.length - 1];
      if (lastNumberStr) {
        const lastNumber = parseInt(lastNumberStr, 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    const paddedNumber = String(nextNumber).padStart(4, "0");
    return `AST-${currentYear}-${paddedNumber}`;
  }
}
