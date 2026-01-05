
import { GoogleGenAI, Type } from "@google/genai";
import { ColoringBookData, TargetAudience, ColoringPage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateBookMetadata = async (theme: string, audience: TargetAudience, authorName?: string): Promise<Partial<ColoringBookData>> => {
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
  // Elaborate prompt based on audience
  const basePrompt = audience === TargetAudience.ADULTS 
    ? "Highly detailed, intricate black and white line art for coloring. Zentangle style, thin clean lines, no gray shading, pure white background, professional illustration."
    : "Simple, thick bold black and white outlines for kids. Large sections for easy coloring, cute character, no small details, pure white background, friendly cartoon style.";
  
  const prompt = `${basePrompt} Subject: ${theme}, specific scene variation ${pageIndex + 1}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4", // Closest to 8.5x11
      }
    }
  });

  let imageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("No image generated");

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: `Page ${pageIndex + 1}`,
    imageUrl,
    prompt
  };
};
