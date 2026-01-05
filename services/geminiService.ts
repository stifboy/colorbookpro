
import { GoogleGenAI, Type } from "@google/genai";
import { ColoringBookData, TargetAudience, ColoringPage } from "../types";

// Generate professional metadata and structure for the coloring book
export const generateBookMetadata = async (theme: string, audience: TargetAudience, authorName?: string): Promise<Partial<ColoringBookData>> => {
  // Always create a new instance right before use to capture the latest selected API key
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
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
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

// Generate high-quality coloring page images using the specialized Pro image model
export const generateColoringPage = async (theme: string, audience: TargetAudience, pageIndex: number): Promise<ColoringPage> => {
  // Always create a new instance right before use to capture the latest selected API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const basePrompt = audience === TargetAudience.ADULTS 
    ? "Masterpiece level, high-resolution 2K line art coloring page. Complex, intricate Zentangle-inspired patterns, razor-sharp clean black outlines, zero shading, zero gray, purely white background. Subject: "
    : "Professional children's coloring page, thick black outlines, simple clear shapes, large coloring areas, friendly character, white background. Subject: ";
  
  const prompt = `${basePrompt}${theme}, page ${pageIndex + 1}. High contrast, 300DPI equivalent, black and white line art only.`;

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
  // Iterate through parts to find the image data as per Gemini 3 image output guidelines
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
    throw new Error("No image data returned. Ensure your project has image generation permissions enabled.");
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: `Page ${pageIndex + 1}`,
    imageUrl,
    prompt
  };
};
