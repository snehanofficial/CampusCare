import { RuleEvaluator } from "./index.js";

export class FailureRule implements RuleEvaluator {
  name = "FailureRule";

  evaluate(asset: any, config: any): number {
    const weight = config.weights?.failures ?? 0.25;
    const failedDeductionPerItem = config.deductions?.failedMaintenance ?? 20;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const failedCount = (asset.maintenanceRecords || []).filter((record: any) => {
      const recordDate = new Date(record.endTime || record.updatedAt || record.createdAt);
      return (
        record.outcome === "FAILED" &&
        recordDate >= thirtyDaysAgo
      );
    }).length;

    return Math.min(100 * weight, failedCount * failedDeductionPerItem);
  }
}
