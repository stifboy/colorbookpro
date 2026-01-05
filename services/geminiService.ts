
import { GoogleGenAI, Type } from "@google/genai";
import { ColoringBookData, TargetAudience, ColoringPage } from "../types.ts";

export const generateBookMetadata = async (theme: string, audience: TargetAudience, authorName?: string): Promise<Partial<ColoringBookData>> => {
  // Instantiate inside the function to get the latest process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse metadata", e);
    return {
      title: `${theme} Coloring Book`,
      subtitle: `Relaxing and creative patterns for ${audience}`,
      author: authorName || "Coloring Master",
      introduction: "Welcome to this wonderful world of creativity!",
      copyrightText: `© ${new Date().getFullYear()} ${authorName || "Coloring Master"}. All rights reserved.`
    };
  }
};

export const generateColoringPage = async (theme: string, audience: TargetAudience, pageIndex: number): Promise<ColoringPage> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Refined prompts for Gemini 3 Pro High Quality
  const basePrompt = audience === TargetAudience.ADULTS 
    ? "Masterpiece level, ultra-intricate black and white line art coloring page. Zentangle patterns, crisp thin black outlines, no shading, no gray, purely white background. Subject: "
    : "Professional children's coloring page, bold thick black outlines, simple clear shapes, large coloring areas, cute and friendly character, white background. Subject: ";
  
  const prompt = `${basePrompt}${theme}, variation ${pageIndex + 1}. Ensure high contrast and print-readiness.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "1K" // High quality for print
      }
    }
  });

  let imageUrl = '';
  // Pro models can return multiple parts; find the inline image data
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
    throw new Error("No image data returned from Gemini 3 Pro. Ensure your API key has appropriate permissions.");
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: `Page ${pageIndex + 1}`,
    imageUrl,
    prompt
  };
};
