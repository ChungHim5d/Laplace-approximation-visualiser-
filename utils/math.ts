
import { DataPoint, DistributionType } from "../types";

// ==========================================
// Distribution Logic
// ==========================================

const getLogProb = (x: number, type: DistributionType, param1: number, param2: number): number => {
  
  switch (type) {
    case DistributionType.Beta:
      // param1 = Alpha, param2 = Beta
      // Log PDF: (alpha - 1)ln(x) + (beta - 1)ln(1-x)
      if (x <= 0 || x >= 1) return -Infinity;
      return (param1 - 1) * Math.log(x) + (param2 - 1) * Math.log(1 - x);

    case DistributionType.Gamma:
      // param1 = Shape (k), param2 = Scale (theta)
      // PDF: x^(k-1) * exp(-x/theta)
      // Log PDF: (k - 1)ln(x) - x/theta
      if (x <= 0) return -Infinity;
      return (param1 - 1) * Math.log(x) - (x / param2);

    case DistributionType.Bimodal:
      // param1 = Asymmetry, param2 = Separation/Width
      return -0.5 * param2 * Math.pow(Math.pow(x, 2) - 4, 2) + (param1 * 0.5) * x;
    
    case DistributionType.HeavyTailed:
      // param1 = Skew, param2 = Tail Heaviness
      // param2 controls log(1 + x^2/v) scale
      return -param2 * Math.log(1 + Math.pow(x, 2)) + (param1 * 0.5) * Math.sin(x);

    case DistributionType.Skewed:
    default:
      // param1 = Skewness, param2 = Sharpness
      return -0.5 * Math.pow(x, 2) * param2 + param1 * Math.sin(x);
  }
};

// First Derivative (Gradient)
const getScore = (x: number, type: DistributionType, param1: number, param2: number): number => {
  switch (type) {
    case DistributionType.Beta:
      // d/dx [ (a-1)ln x + (b-1)ln(1-x) ] = (a-1)/x - (b-1)/(1-x)
      return (param1 - 1) / x - (param2 - 1) / (1 - x);

    case DistributionType.Gamma:
      // d/dx [ (k-1)ln x - x/theta ] = (k-1)/x - 1/theta
      return (param1 - 1) / x - 1 / param2;

    case DistributionType.Bimodal:
      return -2 * param2 * x * (Math.pow(x, 2) - 4) + (param1 * 0.5);

    case DistributionType.HeavyTailed:
      return -param2 * ((2 * x) / (1 + Math.pow(x, 2))) + (param1 * 0.5) * Math.cos(x);

    case DistributionType.Skewed:
    default:
      return -param2 * x + param1 * Math.cos(x);
  }
};

// Second Derivative (Hessian)
const getHessian = (x: number, type: DistributionType, param1: number, param2: number): number => {
  switch (type) {
    case DistributionType.Beta:
      // d/dx [ (a-1)/x - (b-1)/(1-x) ]
      // = -(a-1)/x^2 - (b-1)/(1-x)^2
      return -((param1 - 1) / Math.pow(x, 2)) - ((param2 - 1) / Math.pow(1 - x, 2));

    case DistributionType.Gamma:
      // d/dx [ (k-1)/x - 1/theta ] = -(k-1)/x^2
      return -(param1 - 1) / Math.pow(x, 2);

    case DistributionType.Bimodal:
      // approx d/dx [ -2*s*x^3 + 8*s*x ... ]
      return -2 * param2 * (3 * Math.pow(x, 2) - 4);

    case DistributionType.HeavyTailed:
      const term1 = (2 * param2 * (1 - Math.pow(x, 2))) / Math.pow(1 + Math.pow(x, 2), 2);
      return -term1 - (param1 * 0.5) * Math.sin(x);

    case DistributionType.Skewed:
    default:
      return -param2 - param1 * Math.sin(x);
  }
};

export const getDerivativeLatex = (type: DistributionType): string => {
    switch (type) {
        case DistributionType.Beta:
            return `-\\frac{\\alpha-1}{\\theta^2} - \\frac{\\beta-1}{(1-\\theta)^2}`;
        case DistributionType.Gamma:
            return `-\\frac{k-1}{\\theta^2}`;
        case DistributionType.Bimodal:
            return `-2s(3\\theta^2 - 4)`;
        case DistributionType.HeavyTailed:
            return `-\\frac{2s(1-\\theta^2)}{(1+\\theta^2)^2} + \\frac{k}{2}\\sin(\\theta)`;
        case DistributionType.Skewed:
            return `-s - k\\sin(\\theta)`;
        default:
            return `\\nabla^2 \\log p(\\theta)`;
    }
};

// ==========================================
// Optimization & Generation
// ==========================================

export const findMode = (type: DistributionType, param1: number, param2: number): number => {
  // Initialize roughly where we expect the mass to be
  let x = 0.0;
  
  if (type === DistributionType.Beta) x = 0.5;
  else if (type === DistributionType.Gamma) x = Math.max(0.1, (param1 - 1) * param2); // Mode of Gamma is (k-1)*theta
  else if (type === DistributionType.Bimodal) x = 2.0;
  
  const learningRate = 0.005;
  const iterations = 500;

  for (let i = 0; i < iterations; i++) {
    const grad = getScore(x, type, param1, param2);
    
    // Bounds checking for constrained distributions
    let nextX = x + learningRate * grad;
    
    if (type === DistributionType.Beta) {
        nextX = Math.max(0.001, Math.min(0.999, nextX));
    } else if (type === DistributionType.Gamma) {
        nextX = Math.max(0.001, nextX);
    }
    
    x = nextX;
  }
  return x;
};

export const generateData = (
  type: DistributionType,
  param1: number,
  param2: number
): { data: DataPoint[]; mode: number; hessian: number; curvature: number; domain: [number, number] } => {
  
  // Dynamic Range Determination based on Distribution
  let minX = -5;
  let maxX = 5;
  
  if (type === DistributionType.Beta) {
      minX = 0;
      maxX = 1;
  } else if (type === DistributionType.Gamma) {
      minX = 0;
      // Show enough tail: approx mean + 4 std devs? 
      // Mean = k*theta, Var = k*theta^2
      const mean = param1 * param2;
      const std = Math.sqrt(param1) * param2;
      maxX = mean + 4 * std;
      if (maxX < 5) maxX = 5; 
  }

  const steps = 300;
  const points: DataPoint[] = [];
  
  const mode = findMode(type, param1, param2);
  
  const hessian = getHessian(mode, type, param1, param2);
  // Precision is negative Hessian. If Hessian is positive (convex up), we can't fit a Gaussian directly at that point.
  // Usually at a mode, Hessian is negative (concave down).
  const precision = -hessian; 
  
  // Safeties
  const safePrecision = Math.max(precision, 0.0001);
  const variance = 1 / safePrecision;
  const stdDev = Math.sqrt(variance);
  const normalizer = 1 / (stdDev * Math.sqrt(2 * Math.PI));

  const logProbPeak = getLogProb(mode, type, param1, param2);
  const truePeak = Math.exp(logProbPeak);

  for (let i = 0; i <= steps; i++) {
    const x = minX + (i / steps) * (maxX - minX);
    
    // Skip boundary edges strictly for math safety in log
    if ((type === DistributionType.Beta && (x <= 0 || x >= 1)) || 
        (type === DistributionType.Gamma && x <= 0)) {
        continue;
    }

    // 1. True Distribution
    const logProb = getLogProb(x, type, param1, param2);
    const trueUnnorm = Math.exp(logProb);
    
    // 2. Laplace Approximation (Gaussian)
    let approxPdf: number | null = null;
    if (precision > 0) {
      const exponent = -0.5 * Math.pow((x - mode) / stdDev, 2);
      const scale = truePeak / normalizer; 
      approxPdf = scale * normalizer * Math.exp(exponent);
    }
    
    // 3. Quadratic Approximation (Taylor Expansion in Log Space)
    const taylorLogProb = logProbPeak + 0.5 * hessian * Math.pow(x - mode, 2);

    points.push({
      x,
      truePdf: trueUnnorm,
      approxPdf: approxPdf,
      logProb: logProb, 
      quadApprox: taylorLogProb,
      logProbPeak: logProbPeak
    });
  }

  return { data: points, mode, hessian, curvature: precision, domain: [minX, maxX] };
};
