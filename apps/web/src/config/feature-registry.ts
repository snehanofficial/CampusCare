export interface FeatureFlags {
  automation: boolean;
  heatmap: boolean;
  serviceStatus: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  automation: true,
  heatmap: true,
  serviceStatus: true,
};

export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[featureName] ?? false;
}
