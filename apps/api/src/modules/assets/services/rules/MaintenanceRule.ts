import { RuleEvaluator } from "./index.js";

export class MaintenanceRule implements RuleEvaluator {
  name = "MaintenanceRule";

  evaluate(asset: any, config: any): number {
    const weight = config.weights?.maintenanceOverdue ?? 0.25;
    const overdueDeductionPerItem = config.deductions?.overdueMaintenance ?? 15;
    
    const currentDate = new Date();
    const overdueCount = (asset.maintenanceSchedules || []).filter((schedule: any) => {
      // It is active, scheduled in the past, and has no completed or cancelled records
      const scheduledDate = new Date(schedule.scheduledDate);
      const isPast = scheduledDate < currentDate;
      
      const hasCompletedRecord = (schedule.records || []).some(
        (record: any) => record.status === "COMPLETED" || record.status === "CANCELLED"
      );

      return schedule.isActive && isPast && !hasCompletedRecord;
    }).length;

    return Math.min(100 * weight, overdueCount * overdueDeductionPerItem);
  }
}
