
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExplanation = async (
  stepName: string,
  distributionType: string,
  paramContext: string
): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are an expert tutor explaining Bayesian Machine Learning and the Laplace Approximation.
      
      Current Context:
      - Step: ${stepName}
      - Distribution: ${distributionType}
      - Parameters & Calculated Values: ${paramContext}

      Task: Explain what is happening in 2-3 simple sentences.
      
      Specific Guidelines:
      - If Step is 'Curvature', refer to the 'Hessian' value provided in context. If it's large negative (e.g. -10), say the peak is sharp. If it's small negative (e.g. -0.5), say it's flat.
      - Explain that this Hessian number tells us exactly how "wide" the Gaussian approximation should be.
      - If Distribution is 'Gamma' or 'Beta', briefly mention the parameters (like Alpha/Beta or Shape/Scale) and how they affect the shape we are approximating.
      - Keep it intuitive. No complex jargon without simplified context.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Explanation unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to fetch AI explanation at this time.";
  }
};

export const askQuestion = async (question: string, contextState: string): Promise<string> => {
    try {
        const model = "gemini-2.5-flash";
        const prompt = `
          Context: User is exploring Laplace Approximation math.
          State: ${contextState}.
          
          User Question: "${question}"
          
          Answer as if you are a friendly math tutor. Keep it under 60 words. 
          If they ask about Taylor Series, explain it as " approximating a curve near a point using a polynomial (line, parabola, etc)."
        `;
    
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
    
        return response.text || "No response generated.";
      } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error communicating with AI assistant.";
      }
}
