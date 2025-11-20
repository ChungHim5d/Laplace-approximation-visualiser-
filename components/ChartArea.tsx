
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart
} from 'recharts';
import { DataPoint, AnimationStep } from '../types';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  data: DataPoint[];
  step: AnimationStep;
  mode: number;
  skew: number;
}

const ChartArea: React.FC<Props> = ({ data, step, mode }) => {
  const [showLogSpace, setShowLogSpace] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Reset animation when entering Taylor step
  useEffect(() => {
    if (step === AnimationStep.Taylor) {
      setAnimationProgress(0);
      let start = performance.now();
      let frameId: number;

      const animate = (now: number) => {
        const elapsed = now - start;
        const duration = 1500; // 1.5s morph
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        setAnimationProgress(ease);

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        }
      };
      frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    } else if (step > AnimationStep.Taylor) {
      setAnimationProgress(1);
    } else if (step < AnimationStep.Taylor) {
      setAnimationProgress(0);
    }
  }, [step]);

  // Process data to handle the morphing animation of the parabola
  const chartData = useMemo(() => {
    return data.map(pt => {
      if (pt.logProbPeak !== undefined && pt.quadApprox !== undefined) {
        // Morph: Start at flat line (peak), bend towards quadratic
        const currentQuad = pt.logProbPeak + (pt.quadApprox - pt.logProbPeak) * animationProgress;
        return { ...pt, animatedQuad: currentQuad };
      }
      return pt;
    });
  }, [data, animationProgress]);

  const showModeLine = step >= AnimationStep.FindMode;
  const showTaylorParabola = step >= AnimationStep.Taylor; 
  const showGaussian = step >= AnimationStep.Result;

  // Auto switch view mode based on step for better UX, but allow user override
  useEffect(() => {
      if (step === AnimationStep.Curvature || step === AnimationStep.Taylor) {
          setShowLogSpace(true);
      } else if (step === AnimationStep.Intro || step === AnimationStep.Result) {
          setShowLogSpace(false);
      }
  }, [step]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur p-3 border border-slate-200 shadow-xl rounded-lg text-xs z-50">
          <p className="font-bold text-slate-700 mb-1">x: {Number(label).toFixed(2)}</p>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="capitalize">
                  {entry.name}: {Number(entry.value).toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-slate-800">
            {showLogSpace ? 'Log-Probability Space (Taylor Expansion)' : 'Probability Density Space'}
        </h2>
        
        <div className="flex gap-4 items-center">
            <button 
                onClick={() => setShowLogSpace(!showLogSpace)}
                className="text-xs flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors text-slate-600"
            >
                {showLogSpace ? <EyeOff size={14}/> : <Eye size={14}/>}
                {showLogSpace ? 'Show Density' : 'Show Log-Space'}
            </button>

            <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-slate-800 rounded-full opacity-20"></div>
                    <span className="text-slate-600">{showLogSpace ? 'log P(θ|D)' : 'P(θ|D)'}</span>
                </div>
                {showTaylorParabola && showLogSpace && (
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span className="text-amber-600">Taylor Approx</span>
                    </div>
                )}
                {showGaussian && !showLogSpace && (
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <span className="text-indigo-600">Laplace Approx</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e293b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#1e293b" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorApprox" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
                dataKey="x" 
                type="number" 
                domain={['auto', 'auto']} 
                allowDataOverflow={false}
                tickFormatter={(val) => val.toFixed(1)}
                tick={{fontSize: 12, fill: '#64748b'}}
                axisLine={false}
                tickLine={false}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {!showLogSpace && (
                <>
                    <Area
                        type="monotone"
                        dataKey="truePdf"
                        name="True Posterior"
                        stroke="#1e293b"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTrue)"
                        animationDuration={800}
                    />
                    {showGaussian && (
                        <Area
                            type="monotone"
                            dataKey="approxPdf"
                            name="Laplace Approx"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorApprox)"
                            animationDuration={800}
                        />
                    )}
                </>
            )}

            {showLogSpace && (
                <>
                    <Line
                        type="monotone"
                        dataKey="logProb"
                        name="Log Prob"
                        stroke="#1e293b"
                        strokeWidth={3}
                        dot={false}
                        animationDuration={500}
                    />
                    {/* The Morphing Taylor Series Curve */}
                    {(showTaylorParabola || showGaussian) && (
                         <Line
                            type="monotone"
                            dataKey="animatedQuad"
                            name="Taylor Expansion"
                            stroke="#d97706" // Amber
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            isAnimationActive={false} // We handle animation via state
                        />
                    )}
                </>
            )}

            {showModeLine && (
              <ReferenceLine 
                x={mode} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                label={{ 
                    position: 'top', 
                    value: 'MAP', 
                    fill: '#ef4444', 
                    fontSize: 12, 
                    fontWeight: 600 
                }} 
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Hint Overlay */}
        {step === AnimationStep.Taylor && showLogSpace && (
            <div className="absolute bottom-4 right-4 bg-amber-100 text-amber-800 text-xs px-3 py-2 rounded-lg border border-amber-200 max-w-[200px] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                Animation: The parabola "bends" to match the curvature (Hessian) at the peak.
            </div>
        )}
      </div>
    </div>
  );
};

export default ChartArea;
