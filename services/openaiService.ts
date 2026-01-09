
import OpenAI from "openai";
import { ColoringBookData, TargetAudience, ColoringPage } from "../types";

/**
 * Helper to initialize the OpenAI SDK.
 */
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API Key must be set in your environment variables (OPENAI_API_KEY).");
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

export const generateBookMetadata = async (theme: string, audience: TargetAudience, authorName?: string): Promise<Partial<ColoringBookData>> => {
  const openai = getOpenAI();

  const authorInstruction = authorName ? `The author's name is "${authorName}". Use it.` : "Provide a professional author pseudonym.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates metadata for coloring books. Always respond with valid JSON."
      },
      {
        role: "user",
        content: `Generate KDP metadata for a coloring book.
                 Theme: ${theme}
                 Audience: ${audience}
                 ${authorInstruction}
                 Include a catchy title, a descriptive subtitle, a 1-paragraph introduction for the book, and a standard copyright notice.

                 Respond with JSON in this exact format:
                 {
                   "title": "string",
                   "subtitle": "string",
                   "author": "string",
                   "introduction": "string",
                   "copyrightText": "string"
                 }`
      }
    ],
    response_format: { type: "json_object" }
  });

  try {
    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse metadata", e);
    return {
      title: `${theme} Coloring Book`,
      subtitle: `Relaxing and creative patterns for ${audience}`,
      author: authorName || "AI Artist",
      introduction: "Welcome to this wonderful world of creativity!",
      copyrightText: `© ${new Date().getFullYear()}. All rights reserved.`
    };
  }
};

export const generateColoringPage = async (theme: string, audience: TargetAudience, pageIndex: number): Promise<ColoringPage> => {
  const openai = getOpenAI();

  const basePrompt = audience === TargetAudience.ADULTS
    ? "High-resolution line art coloring page. Complex, intricate Zentangle-inspired patterns, razor-sharp clean black outlines, zero shading, zero gray, pure white background. Subject: "
    : "Professional children's coloring page, bold thick black outlines, simple clear shapes, large coloring areas, friendly character, white background. No shading. Subject: ";

  const prompt = `${basePrompt}${theme}, page ${pageIndex + 1}. High contrast, pure black and white line art suitable for coloring.`;

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1536",
    response_format: "b64_json"
  });

  const imageData = response.data[0]?.b64_json;
  if (!imageData) {
    throw new Error("No image data returned from OpenAI. Please verify your API key has image generation access.");
  }

  const imageUrl = `data:image/png;base64,${imageData}`;

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: `Page ${pageIndex + 1}`,
    imageUrl,
    prompt
  };
};
