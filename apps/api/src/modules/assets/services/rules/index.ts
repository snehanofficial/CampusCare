export interface RuleEvaluator {
  name: string;
  evaluate(asset: any, config: any): number;
  overrideScore?(asset: any, score: number): number;
}
