import { prisma } from "../../../database/prisma.js";

export class ItemCodeGenerator {
  static async generateCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const lastItem = await prisma.inventoryItem.findFirst({
      where: { itemCode: { startsWith: `INV-${currentYear}-` } },
      orderBy: { createdAt: "desc" },
      select: { itemCode: true },
    });
    
    let nextNumber = 1;
    if (lastItem?.itemCode) {
      const parts = lastItem.itemCode.split("-");
      const lastNum = parseInt(parts[parts.length - 1]!, 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    
    return `INV-${currentYear}-${String(nextNumber).padStart(4, "0")}`;
  }
}
