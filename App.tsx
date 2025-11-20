
import React, { useState, useMemo, useEffect } from 'react';
import { AnimationStep, DistributionType } from './types';
import { generateData } from './utils/math';
import ChartArea from './components/ChartArea';
import StepControl from './components/StepControl';
import ExplanationPanel from './components/ExplanationPanel';
import { RotateCcw, Settings2, Info } from 'lucide-react';

// Configuration for each distribution type
const DIST_CONFIG = {
  [DistributionType.Skewed]: {
    p1: { label: "Skewness", min: -3, max: 3, step: 0.1, def: 1.0 },
    p2: { label: "Sharpness", min: 0.5, max: 5, step: 0.1, def: 1.0 }
  },
  [DistributionType.Bimodal]: {
    p1: { label: "Asymmetry", min: -2, max: 2, step: 0.1, def: 0 },
    p2: { label: "Separation", min: 1, max: 4, step: 0.1, def: 2.0 }
  },
  [DistributionType.HeavyTailed]: {
    p1: { label: "Skew", min: -2, max: 2, step: 0.1, def: 0 },
    p2: { label: "Tail Heaviness", min: 0.5, max: 3, step: 0.1, def: 1.0 }
  },
  [DistributionType.Beta]: {
    p1: { label: "Alpha (α)", min: 1.5, max: 10, step: 0.1, def: 2.0 },
    p2: { label: "Beta (β)", min: 1.5, max: 10, step: 0.1, def: 5.0 }
  },
  [DistributionType.Gamma]: {
    p1: { label: "Shape (k)", min: 1.5, max: 9, step: 0.1, def: 2.0 },
    p2: { label: "Scale (θ)", min: 0.5, max: 3, step: 0.1, def: 1.0 }
  }
};

const App: React.FC = () => {
  const [step, setStep] = useState<AnimationStep>(AnimationStep.Intro);
  
  // Simulation parameters
  const [distributionType, setDistributionType] = useState<DistributionType>(DistributionType.Skewed);
  
  // Generic parameters (their meaning depends on distributionType)
  const [param1, setParam1] = useState<number>(1.0);
  const [param2, setParam2] = useState<number>(1.0);

  // When distribution changes, reset parameters to defaults
  useEffect(() => {
    const config = DIST_CONFIG[distributionType];
    setParam1(config.p1.def);
    setParam2(config.p2.def);
    setStep(AnimationStep.Intro);
  }, [distributionType]);

  // Generate data based on parameters
  const { data, mode, hessian } = useMemo(() => {
    return generateData(distributionType, param1, param2);
  }, [distributionType, param1, param2]);

  const handleReset = () => {
    setStep(AnimationStep.Intro);
    const config = DIST_CONFIG[distributionType];
    setParam1(config.p1.def);
    setParam2(config.p2.def);
  };

  const currentConfig = DIST_CONFIG[distributionType];

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-10">
        <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-serif italic">L</span>
                Laplace Approximation Visualizer
            </h1>
            <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
              Bayesian Inference & Taylor Series Expansion <Info size={12} />
            </p>
        </div>
        
        <div className="flex items-center gap-4">
             <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
                <RotateCcw size={16} />
                Reset View
            </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden max-w-[1600px] mx-auto w-full">
        
        {/* Left Sidebar: Controls & Steps */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto pr-2">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                    <Settings2 size={18} />
                    <h2 className="font-bold text-sm uppercase tracking-wider">Parameters</h2>
                </div>
                
                <div className="space-y-6">
                    {/* Distribution Selector */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Posterior Shape</label>
                        <div className="space-y-1">
                            {Object.values(DistributionType).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setDistributionType(type)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                                        distributionType === type 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Dynamic Parameter 1 */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <label className="font-medium text-slate-600">{currentConfig.p1.label}</label>
                            <span className="text-slate-400">{param1.toFixed(1)}</span>
                        </div>
                        <input
                            type="range"
                            min={currentConfig.p1.min}
                            max={currentConfig.p1.max}
                            step={currentConfig.p1.step}
                            value={param1}
                            onChange={(e) => setParam1(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                    
                    {/* Dynamic Parameter 2 */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <label className="font-medium text-slate-600">{currentConfig.p2.label}</label>
                            <span className="text-slate-400">{param2.toFixed(1)}</span>
                        </div>
                        <input
                            type="range"
                            min={currentConfig.p2.min}
                            max={currentConfig.p2.max}
                            step={currentConfig.p2.step}
                            value={param2}
                            onChange={(e) => setParam2(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                </div>
            </div>

            <StepControl currentStep={step} setStep={setStep} />
        </div>

        {/* Center: Visualization */}
        <div className="col-span-12 lg:col-span-6 h-full min-h-[400px]">
            <ChartArea 
                data={data} 
                step={step} 
                mode={mode}
                skew={param1} 
            />
        </div>

        {/* Right Sidebar: Explanation */}
        <div className="col-span-12 lg:col-span-3 h-full overflow-y-auto">
            <ExplanationPanel 
                step={step} 
                distributionType={distributionType} 
                param1={param1}
                param2={param2}
                param1Label={currentConfig.p1.label}
                param2Label={currentConfig.p2.label}
                mode={mode}
                hessian={hessian}
            />
        </div>

      </main>
    </div>
  );
};

export default App;
