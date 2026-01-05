
import { GoogleGenAI, Type } from "@google/genai";
import { ColoringBookData, TargetAudience, ColoringPage } from "../types";

// Helper to get a fresh AI instance with the current environment key
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("An API Key must be set when running in a browser. Please connect your project using the 'Connect API Key' button.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBookMetadata = async (theme: string, audience: TargetAudience, authorName?: string): Promise<Partial<ColoringBookData>> => {
  const ai = getAI();
  
  const authorInstruction = authorName ? `The author's name is "${authorName}". Use it.` : "Provide a professional author pseudonym.";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate KDP metadata for a coloring book. 
               Theme: ${theme}
               Audience: ${audience}
               ${authorInstruction}
               Include a catchy title, a descriptive subtitle, a 1-paragraph introduction for the book, and a standard copyright notice.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          author: { type: Type.STRING },
          introduction: { type: Type.STRING },
          copyrightText: { type: Type.STRING }
        },
        required: ["title", "subtitle", "author", "introduction", "copyrightText"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse metadata", e);
    return {
      title: `${theme} Coloring Book`,
      subtitle: `Creative designs for ${audience}`,
      author: authorName || "AI Artist",
      introduction: "Welcome to your next creative adventure.",
      copyrightText: `© ${new Date().getFullYear()}. All rights reserved.`
    };
  }
};

export const generateColoringPage = async (theme: string, audience: TargetAudience, pageIndex: number): Promise<ColoringPage> => {
  const ai = getAI();
  
  const basePrompt = audience === TargetAudience.ADULTS 
    ? "High-resolution 2K line art coloring page. Extremely intricate patterns, clean sharp black outlines, zero shading, zero gray gradients, pure white background. Professional Zentangle or detailed illustration style. Subject: "
    : "Professional children's coloring page, bold thick black outlines, simple clear shapes, large coloring areas, friendly character, white background. No shading. Subject: ";
  
  const prompt = `${basePrompt}${theme}, page ${pageIndex + 1}. Print-ready, high contrast, pure black and white line art.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "1K"
      }
    }
  });

  let imageUrl = '';
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No image data returned from the model. Please ensure your project has Image Generation permissions.");
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: `Page ${pageIndex + 1}`,
    imageUrl,
    prompt
  };
};
