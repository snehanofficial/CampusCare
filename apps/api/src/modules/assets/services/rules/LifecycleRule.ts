import { RuleEvaluator } from "./index.js";

export class LifecycleRule implements RuleEvaluator {
  name = "LifecycleRule";

  evaluate(asset: any, config: any): number {
    // Standard evaluation can return 0, since overrides are handled in overrideScore
    return 0;
  }

  overrideScore(asset: any, score: number): number {
    const status = (asset.status || "").toUpperCase();
    const lifecycleStage = (asset.lifecycleStage || "").toUpperCase();

    if (status === "BROKEN" || lifecycleStage === "RETIRED" || lifecycleStage === "DISPOSED") {
      return 0;
    }
    if (status === "MAINTENANCE" || lifecycleStage === "MAINTENANCE") {
      return Math.min(score, 50);
    }
    return score;
  }
}
