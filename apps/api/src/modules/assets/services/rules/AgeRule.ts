import { RuleEvaluator } from "./index.js";

export class AgeRule implements RuleEvaluator {
  name = "AgeRule";

  evaluate(asset: any, config: any): number {
    const weight = config.weights?.age ?? 0.25;
    const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(asset.createdAt);
    const ageInDays = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const categoryName = asset.category?.name || "Default";
    const lifespanYears = config.categoryLifespans?.[categoryName] || config.lifespanYearsDefault || 5;
    const lifespanDays = lifespanYears * 365;
    
    const ageRatio = Math.min(1, Math.max(0, ageInDays / lifespanDays));
    return ageRatio * 100 * weight;
  }
}
