
import React from 'react';
import { AnimationStep } from '../types';
import { ChevronRight, RefreshCw, Search, Activity, CheckCircle, TrendingUp } from 'lucide-react';

interface StepControlProps {
  currentStep: AnimationStep;
  setStep: (step: AnimationStep) => void;
}

const steps = [
  { id: AnimationStep.Intro, label: 'The Posterior', icon: Activity, desc: 'Visualize the complex distribution' },
  { id: AnimationStep.FindMode, label: '1. Find Mode', icon: Search, desc: 'Locate the peak (MAP)' },
  { id: AnimationStep.Curvature, label: '2. Curvature', icon: RefreshCw, desc: 'Compute Hessian (width)' },
  { id: AnimationStep.Taylor, label: '3. Quadratic', icon: TrendingUp, desc: 'Taylor Series Approximation' },
  { id: AnimationStep.Result, label: '4. Laplace Approx', icon: CheckCircle, desc: 'Exponentiate to Gaussian' },
];

const StepControl: React.FC<StepControlProps> = ({ currentStep, setStep }) => {
  return (
    <div className="flex flex-col space-y-2 w-full">
      {steps.map((s, idx) => {
        const Icon = s.icon;
        const isActive = currentStep === s.id;
        const isCompleted = currentStep > s.id;

        return (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`
              relative flex items-center p-4 rounded-xl transition-all duration-300 border text-left group
              ${isActive 
                ? 'bg-indigo-50 border-indigo-500 shadow-md translate-x-2' 
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }
              ${isCompleted ? 'border-indigo-200 bg-slate-50/50' : ''}
            `}
          >
            <div className={`
              p-2 rounded-lg mr-4 transition-colors
              ${isActive ? 'bg-indigo-600 text-white' : isCompleted ? 'bg-indigo-100 text-indigo-400' : 'bg-slate-100 text-slate-400'}
            `}>
              <Icon size={20} />
            </div>
            
            <div className="flex-1">
              <h3 className={`font-semibold ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                {s.label}
              </h3>
              <p className="text-xs text-slate-500">{s.desc}</p>
            </div>

            {isActive && (
              <ChevronRight className="text-indigo-500 animate-pulse" size={20} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StepControl;
