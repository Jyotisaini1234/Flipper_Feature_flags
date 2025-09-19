export interface Features {
  [key: string]: boolean;
}

export interface DashboardData {
  dashboardVersion?: string;
  layout?: string;
  features: Features;
  userId: string;
  userHash: number;
}

export interface ExperimentData {
  variant?: 'control' | 'variant_a' | 'variant_b';
  welcomeMessage?: string;
  buttonColor?: string;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  percentage?: number;
  actors?: string;
}

export interface PercentageInput {
  [featureName: string]: string;
}

export interface ActorInput {
  [featureName: string]: string;
}