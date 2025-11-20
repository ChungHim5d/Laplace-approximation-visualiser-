
import React, { useEffect, useState } from 'react';
import { Gauge, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  hessian: number;
  mode: number;
}

const HessianVisualizer: React.FC<Props> = ({ hessian, mode }) => {
  // Animate the display value
  const [displayHessian, setDisplayHessian] = useState(0);
  
  useEffect(() => {
    const duration = 800;
    const start = displayHessian;
    const end = hessian;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      
      setDisplayHessian(start + (end - start) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [hessian]);

  const isConcaveDown = hessian < 0; // This is what we usually want for a maximum
  const colorClass = isConcaveDown ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-rose-600 bg-rose-50 border-rose-200";
  const tileColor = isConcaveDown ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";

  // Map hessian to rotation (-180 to 0 for negative, 0 to 180 for positive)
  // Clamped between -10 and 10 for visual scale
  const clampedH = Math.max(-10, Math.min(10, displayHessian));
  const rotation = (clampedH / 10) * 90; // -90deg to +90deg

  return (
    <div className="flex flex-col gap-4 w-full">
        
        {/* Matrix Representation */}
        <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Hessian Matrix (1x1)</span>
                <div className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 shadow-sm transition-colors duration-500 ${colorClass}`}>
                    <span className="font-mono font-bold text-lg">{displayHessian.toFixed(1)}</span>
                </div>
            </div>

            <div className="text-xs text-slate-500 max-w-[120px]">
                {isConcaveDown 
                    ? "Negative H indicates a peak (concave down)." 
                    : "Positive H indicates a valley (convex up)."}
            </div>
        </div>

        {/* Curvature Dial */}
        <div className="relative h-32 bg-slate-50 rounded-xl border border-slate-100 flex items-end justify-center pb-4 overflow-hidden">
            <div className="absolute top-2 left-3 flex items-center gap-1 text-slate-400">
                <Gauge size={14} />
                <span className="text-[10px] uppercase font-bold">Curvature Dial</span>
            </div>

            {/* Gauge Background */}
            <div className="w-48 h-24 bg-slate-200 rounded-t-full relative overflow-hidden">
                {/* Color Zones */}
                <div className="absolute bottom-0 left-0 w-1/2 h-full bg-emerald-200/50 origin-bottom-right"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-full bg-rose-200/50 origin-bottom-left"></div>
                
                {/* Tick Marks */}
                <div className="absolute bottom-0 left-1/2 w-0.5 h-full bg-white/50 -translate-x-1/2 z-10"></div>
            </div>

            {/* Needle */}
            <div 
                className="absolute bottom-4 left-1/2 w-1 h-24 bg-slate-800 origin-bottom rounded-full transition-transform duration-100 z-20"
                style={{ 
                    transform: `translateX(-50%) rotate(${rotation}deg)`,
                    transformOrigin: 'bottom center'
                }}
            >
                <div className="w-3 h-3 bg-slate-800 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2"></div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-2 left-8 text-[10px] font-bold text-emerald-700">Sharp Peak</div>
            <div className="absolute bottom-2 right-8 text-[10px] font-bold text-rose-700">Valley</div>
        </div>

        <div className="flex justify-between text-xs px-2">
            <div className="text-center">
                <span className="block font-bold text-slate-700">Curvature</span>
                <span className="text-slate-500">|H| = {Math.abs(displayHessian).toFixed(2)}</span>
            </div>
            <div className="text-center">
                <span className="block font-bold text-slate-700">Width (σ)</span>
                <span className="text-slate-500">
                    {isConcaveDown ? Math.sqrt(1/Math.abs(displayHessian)).toFixed(2) : "Undefined"}
                </span>
            </div>
        </div>

    </div>
  );
};

export default HessianVisualizer;
