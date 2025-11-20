
export interface DataPoint {
  x: number;
  truePdf: number;
  approxPdf: number | null;
  logProb?: number;
  quadApprox?: number;
  logProbPeak?: number; // The constant term in Taylor series
}

export enum AnimationStep {
  Intro = 0,
  FindMode = 1,
  Curvature = 2,
  Taylor = 3,
  Result = 4
}

export enum DistributionType {
  Skewed = 'Skewed Unimodal',
  Bimodal = 'Bimodal (Double Well)',
  HeavyTailed = 'Heavy Tailed (Student-t)',
  Beta = 'Beta (Binomial Posterior)',
  Gamma = 'Gamma Distribution'
}

export interface SimulationParams {
  skew: number; // Controls the asymmetry of the target distribution
  sharpness: number; // Controls the peak width
}
