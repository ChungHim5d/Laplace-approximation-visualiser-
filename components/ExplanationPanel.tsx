
import React, { useEffect, useState, useRef } from 'react';
import { AnimationStep, DistributionType } from '../types';
import { generateExplanation, askQuestion } from '../services/geminiService';
import { getDerivativeLatex } from '../utils/math';
import HessianVisualizer from './HessianVisualizer';
import { Sparkles, MessageSquare, Loader2, Sigma, BookOpen } from 'lucide-react';

// Declare KaTeX on window
declare global {
  interface Window {
    katex: any;
  }
}

interface Props {
  step: AnimationStep;
  distributionType: DistributionType;
  param1: number;
  param2: number;
  param1Label: string;
  param2Label: string;
  mode: number;
  hessian: number;
}

const LatexRenderer: React.FC<{ latex: string; block?: boolean; className?: string }> = ({ latex, block = true, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple polling to wait for KaTeX to load from CDN
    const checkKatex = () => {
      if (window.katex) {
        setIsReady(true);
      } else {
        setTimeout(checkKatex, 100);
      }
    };
    checkKatex();
  }, []);

  useEffect(() => {
    if (isReady && window.katex && containerRef.current) {
      try {
        window.katex.render(latex, containerRef.current, {
          throwOnError: false,
          displayMode: block,
          macros: {
            "\\f": "#1f1f1f"
          }
        });
      } catch (e) {
        console.error("KaTeX rendering error", e);
        containerRef.current.innerText = latex;
      }
    }
  }, [latex, block, isReady]);

  return (
    <div ref={containerRef} className={`${block ? "my-4 overflow-x-auto overflow-y-hidden py-2" : "inline-block mx-1 align-middle"} ${className}`}>
        {!isReady && <span className="opacity-50 text-sm font-mono text-slate-500">{latex}</span>}
    </div>
  );
};

const getNarrative = (step: AnimationStep, dist: DistributionType) => {
    if (step === AnimationStep.Intro) {
        return {
            title: "The Target Distribution",
            formula: "P(\\theta \\mid D) \\propto \\underbrace{P(D\\mid\\theta)}_{\\text{Likelihood}} \\cdot \\underbrace{P(\\theta)}_{\\text{Prior}}",
            narrative: (
                <>
                    <p className="mb-3">We start with a potentially complex posterior distribution.</p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600">
                        <li>This represents our knowledge about parameter <LatexRenderer latex="\theta" block={false} /> after seeing data <LatexRenderer latex="D" block={false} />.</li>
                        <li>Calculating expectations on this directly can be mathematically impossible (intractable).</li>
                        <li><b>Laplace Approximation</b> aims to replace this with a simple Gaussian.</li>
                    </ul>
                </>
            )
        };
    }

    switch(step) {
        case AnimationStep.FindMode:
            return {
                title: "Step 1: Find the Mode (θ*)",
                formula: "\\theta^* = \\underbrace{\\operatorname*{argmax}_\\theta}_{\\text{find peak}} \\; \\underbrace{\\log P(\\theta, D)}_{\\text{log-posterior}}",
                narrative: (
                    <>
                        <p className="mb-3">The first thing we do is look for the <b>mode</b>, which is the highest point of the posterior curve.</p>
                        <p className="mb-3">Think of it like climbing a hill: wherever the slope becomes flat and turns from going up to going down, that’s the peak. Mathematically, this is where the first derivative is zero:</p>
                        <div className="bg-slate-50 rounded p-3 text-center border border-slate-100 mb-3">
                            <LatexRenderer latex="\nabla \log p(\theta) = 0" block={false} />
                        </div>
                        <p className="mt-2">We call this special point <LatexRenderer latex="\theta^*" block={false} /> because it’s the most probable value of <LatexRenderer latex="\theta" block={false} /> after seeing the data.</p>
                    </>
                )
            };
        case AnimationStep.Curvature:
            return {
                title: "Step 2: Compute Curvature (Hessian)",
                formula: "H = \\underbrace{\\nabla^2}_{\\text{curvature}} \\underbrace{\\log P(\\theta \\mid D)}_{\\text{at the peak}} \\bigg|_{\\theta=\\theta^*}",
                narrative: (
                    <div className="space-y-5 text-slate-700">
                        <div>
                            <h4 className="font-bold text-indigo-900 text-base uppercase mb-2">What the dial shows</h4>
                            <p className="mb-2 leading-relaxed">The curvature dial tells you how sharply the log-posterior bends at the mode. This bending is measured by the <b>Hessian</b> <LatexRenderer latex="H" block={false} />.</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-indigo-900 text-base uppercase mb-2">How to read it</h4>
                            <ul className="space-y-4 pl-2 border-l-4 border-indigo-100">
                                <li>
                                    <span className="font-semibold text-emerald-700 block text-xl">Far Left (Deep Green)</span>
                                    The peak is sharp (high certainty). <br/>Result: <b>Narrow Gaussian</b>.
                                </li>
                                <li>
                                    <span className="font-semibold text-slate-600 block text-xl">Center (Grey)</span>
                                    The peak is gentle (more uncertainty). <br/>Result: <b>Wide Gaussian</b>.
                                </li>
                                <li>
                                    <span className="font-semibold text-rose-600 block text-xl">Right (Red)</span>
                                    The curve bends upward (convex). <br/>Result: <b>Invalid</b> (Laplace fails).
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-indigo-900 text-base uppercase mb-2">Why it matters</h4>
                            <p className="mb-2">The Hessian controls the variance of our approximation:</p>
                            <div className="text-center bg-slate-50 py-4 rounded mb-2 border border-slate-100">
                                <LatexRenderer latex="\sigma^2 = -H^{-1}" block={false} />
                            </div>
                            <ul className="list-disc pl-5 text-slate-600 mt-2">
                                <li>Larger negative curvature → Smaller variance</li>
                                <li>Smaller negative curvature → Larger variance</li>
                            </ul>
                        </div>

                        <div className="bg-indigo-50 p-5 rounded-lg text-indigo-900 border border-indigo-100">
                            <h4 className="font-bold mb-2 text-base uppercase">Intuition: The Clay Analogy</h4>
                            <p>Imagine pushing your finger into soft clay:</p>
                            <ul className="mt-2 space-y-2 list-disc pl-5 opacity-90">
                                <li>Resists strongly (sharp peak) → Large Negative <LatexRenderer latex="H" block={false} /></li>
                                <li>Sinks easily (flat peak) → Small Negative <LatexRenderer latex="H" block={false} /></li>
                            </ul>
                        </div>
                    </div>
                )
            };
        case AnimationStep.Taylor:
             return {
                title: "Step 3: Build Quadratic Approx",
                formula: "\\log p(\\theta) \\approx \\underbrace{\\log p(\\theta^*)}_{\\text{peak height}} + \\underbrace{\\frac{1}{2} H (\\theta - \\theta^*)^2}_{\\text{quadratic curvature}}",
                narrative: (
                    <>
                        <p className="mb-3">Near the mode, any smooth curve can be approximated by a <b>quadratic (a parabola)</b>.</p>
                        <p className="mb-3">This uses the <b>Second-Order Taylor Expansion</b>. We replace the complicated real posterior with a simple parabola that has:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600">
                            <li>The same peak height.</li>
                            <li>The same location <LatexRenderer latex="(\theta^*)" block={false} />.</li>
                            <li>The same curvature <LatexRenderer latex="(H)" block={false} />.</li>
                        </ul>
                    </>
                )
            };
        case AnimationStep.Result:
            return {
                title: "Step 4 & 5: Exponentiate to Gaussian",
                formula: "q(\\theta) = \\mathcal{N}\\Big(\\theta \\;\\Big|\\; \\underbrace{\\theta^*}_{\\text{mean}}, \\; \\underbrace{-H^{-1}}_{\\text{variance}}\\Big)",
                narrative: (
                    <>
                        <p className="mb-3">When we exponentiate the quadratic approximation of the log-posterior, it becomes a <b>Gaussian (Normal distribution)</b>.</p>
                        <div className="bg-indigo-50 p-5 rounded border border-indigo-100 my-4 text-center flex justify-around items-center">
                            <LatexRenderer latex="\text{Mean} = \theta^*" block={false} className="text-indigo-900 font-bold text-lg" />
                            <span className="text-indigo-300 text-3xl">|</span>
                            <LatexRenderer latex="\text{Var}(\sigma^2) = -H^{-1}" block={false} className="text-indigo-900 font-bold text-lg" />
                        </div>
                        <p>This Gaussian matches the posterior extremely well near the mode, giving us a smooth summary of the distribution.</p>
                    </>
                )
            };
        default:
            return { title: "", formula: "", narrative: null };
    }
}

const ExplanationPanel: React.FC<Props> = ({ 
  step, distributionType, param1, param2, param1Label, param2Label, mode, hessian 
}) => {
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [answerLoading, setAnswerLoading] = useState(false);

  const content = getNarrative(step, distributionType);
  const derivativeLatex = getDerivativeLatex(distributionType);

  useEffect(() => {
    let isMounted = true;
    const fetchExplanation = async () => {
      setLoading(true);
      const stepName = AnimationStep[step];
      const paramContext = `${param1Label}=${param1.toFixed(1)}, ${param2Label}=${param2.toFixed(1)}, Hessian=${hessian.toFixed(2)}, Mode=${mode.toFixed(2)}`;
      
      // We still fetch dynamic AI context for "Fun Facts" or simpler context
      const text = await generateExplanation(stepName, distributionType, paramContext);
      if (isMounted) {
        setExplanation(text);
        setLoading(false);
      }
    };

    fetchExplanation();
    setAiAnswer(null); 
    return () => { isMounted = false; };
  }, [step, distributionType, param1, param2, param1Label, param2Label, hessian, mode]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    setAnswerLoading(true);
    const stepName = AnimationStep[step];
    const context = `Step: ${stepName}, Dist: ${distributionType}, ${param1Label}=${param1}, ${param2Label}=${param2}, hessian=${hessian.toFixed(2)}`;
    const ans = await askQuestion(userQuestion, context);
    setAiAnswer(ans);
    setAnswerLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col overflow-y-auto">
      
      {/* Math Context & Narrative */}
      <div className="mb-6 bg-slate-50 rounded-xl p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-4 text-indigo-700">
            <BookOpen size={24} />
            <h3 className="font-bold text-xl uppercase tracking-wide">{content.title}</h3>
        </div>
        
        {/* Formula Box */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[7rem] flex items-center justify-center px-4 my-5 text-xl">
             {content.formula && <LatexRenderer latex={content.formula} />}
        </div>

        {/* Structured Narrative */}
        <div className="text-lg text-slate-800 mt-5 leading-relaxed font-medium">
            {content.narrative}
        </div>
      </div>

      {/* Visual Calculation Tools */}
      {step >= AnimationStep.Curvature && (
          <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Hessian Visualizer */}
             <HessianVisualizer hessian={hessian} mode={mode} />

             {/* Live Calculation Trace */}
             <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                 <div className="flex items-center gap-2 mb-3 text-emerald-800">
                     <Sigma size={24} />
                     <h3 className="font-bold text-base uppercase">Live Derivation Trace</h3>
                 </div>
                 <div className="text-base font-mono text-slate-700 space-y-3 overflow-x-auto">
                     <div className="flex items-center gap-3">
                         <span className="text-slate-500 w-24 shrink-0">Deriv:</span>
                         <LatexRenderer latex={`\\frac{d^2f}{d\\theta^2} = ${derivativeLatex}`} block={false} />
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-slate-500 w-24 shrink-0">At Mode:</span>
                        <LatexRenderer latex={`\\theta^* = ${mode.toFixed(3)}`} block={false} />
                     </div>
                     <div className="flex items-center gap-3 font-bold text-emerald-700 mt-2 pt-3 border-t border-emerald-200">
                        <span className="w-24 shrink-0">Result:</span>
                        <LatexRenderer latex={`H = ${hessian.toFixed(3)}`} block={false} />
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* Dynamic AI Tutor */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="text-indigo-500" size={24} />
          <h2 className="font-bold text-lg text-slate-800 uppercase tracking-wide">AI Insights</h2>
        </div>
        
        <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 text-slate-700 text-base leading-relaxed italic shadow-sm">
          {loading ? (
            <div className="flex items-center space-x-2 text-slate-400">
              <Loader2 className="animate-spin" size={20} />
              <span>Analyzing current parameters...</span>
            </div>
          ) : (
            <p>"{explanation}"</p>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="border-t border-slate-100 pt-6 mt-auto">
        <h3 className="font-semibold text-sm text-slate-500 mb-3 uppercase tracking-wider">Ask a Question</h3>
        
        {aiAnswer && (
            <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-base text-indigo-800 border border-indigo-100">
                <span className="font-bold block mb-1 text-indigo-900">Answer:</span>
                {aiAnswer}
            </div>
        )}

        <form onSubmit={handleAsk} className="flex gap-3">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="e.g. What if H is positive?"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            type="submit"
            disabled={answerLoading || !userQuestion}
            className="bg-indigo-600 text-white rounded-xl px-4 py-3 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {answerLoading ? <Loader2 className="animate-spin" size={24} /> : <MessageSquare size={24} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExplanationPanel;
