import { RuleEvaluator } from "./index.js";

export class IncidentRule implements RuleEvaluator {
  name = "IncidentRule";

  evaluate(asset: any, config: any): number {
    const weight = config.weights?.openTickets ?? 0.25;
    const deductions = config.deductions || {};
    
    const openTickets = (asset.tickets || []).filter((ticket: any) => {
      const status = (ticket.status || "").toUpperCase();
      return status !== "RESOLVED" && status !== "CLOSED";
    });

    let totalDeduction = 0;
    for (const ticket of openTickets) {
      const priority = (ticket.priority || "").toUpperCase();
      if (priority === "CRITICAL") {
        totalDeduction += deductions.openCriticalTicket ?? 25;
      } else if (priority === "HIGH") {
        totalDeduction += deductions.openHighTicket ?? 15;
      } else if (priority === "MEDIUM") {
        totalDeduction += deductions.openMediumTicket ?? 5;
      } else {
        totalDeduction += deductions.openLowTicket ?? 2;
      }
    }

    return Math.min(100 * weight, totalDeduction);
  }
}
