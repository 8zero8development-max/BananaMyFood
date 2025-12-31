import { GoogleGenAI, Type } from "@google/genai";
import { BrandDna, ImageSize, CreativeConcept } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Analyzes brand inputs (Text, URL, Logo, Source Image) to produce structured Brand DNA.
 * Uses gemini-2.5-flash for speed and free-tier compatibility.
 */
export const researchBrandDna = async (
  description: string, 
  websiteUrl: string, 
  logoBase64: string | null,
  sourceImageBase64: string | null
): Promise<BrandDna> => {
  const ai = getAiClient();
  
  let prompt = `Analyze the provided brand assets to extract a structured Brand DNA profile.
  
  Inputs:
  - Description: "${description}"
  - Website: "${websiteUrl}"
  ${logoBase64 ? "- A logo image is attached." : ""}
  ${sourceImageBase64 ? "- A sample product/food photo is attached." : ""}

  Task:
  1. Infer the Brand Name if not explicitly stated.
  2. Analyze the visual style (colors, fonts, lighting, plating, vibe) from the logo and the sample product photo (if provided). The product photo is a key indicator of the brand's aesthetic.
  3. Determine the Tone of Voice.
  4. Extract key themes/keywords.
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (logoBase64) {
    const base64Data = logoBase64.split(',')[1] || logoBase64;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    });
  }

  if (sourceImageBase64) {
    const base64Data = sourceImageBase64.split(',')[1] || sourceImageBase64;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          tone: { type: Type.STRING },
          visualStyle: { type: Type.STRING, description: "Description of colors, shapes, and visual identity inferred from logo/desc/photo" },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "description", "tone", "keywords", "visualStyle"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  const result = JSON.parse(text);
  
  return {
    ...result,
    websiteUrl,
    logoImage: logoBase64
  };
};

/**
 * Generates 3 Creative Concepts based on Brand DNA and Source Image.
 * Uses gemini-2.5-flash.
 */
export const generateCreativeConcepts = async (
  brandDna: BrandDna,
  sourceImageBase64: string
): Promise<CreativeConcept[]> => {
  const ai = getAiClient();
  const base64Data = sourceImageBase64.split(',')[1] || sourceImageBase64;

  const prompt = `You are a world-class Creative Director. 
  
  Context:
  We have a food photo and need to create a Facebook campaign for the brand "${brandDna.name}".
  
  Brand DNA:
  - Tone: ${brandDna.tone}
  - Visual Style: ${brandDna.visualStyle}
  - Keywords: ${brandDna.keywords.join(', ')}

  Task:
  Analyze the attached food image. Generate 3 DISTINCT creative concepts for a Facebook Hero Post.
  Each concept should have a different angle (e.g., one focused on ingredients, one on lifestyle/mood, one on humor/boldness).

  For each concept, provide:
  1. Title: A short internal name for the concept.
  2. Rationale: Why this works for the image+brand.
  3. VisualPrompt: A detailed prompt for an AI image generator to create a polished "Hero" version of the food, incorporating brand colors/style.
  4. CopyAngle: Instructions for the copywriter.
  5. OverlayCta: A short, punchy 2-5 word Call-to-Action to be overlaid on the image (e.g., "Taste the Fire", "Order Now", "Weekend Special").
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            rationale: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            copyAngle: { type: Type.STRING },
            overlayCta: { type: Type.STRING },
          },
          required: ["id", "title", "rationale", "visualPrompt", "copyAngle", "overlayCta"]
        }
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate concepts");
  return JSON.parse(response.text) as CreativeConcept[];
};

/**
 * Generates the final Hero Image based on a selected Concept.
 * Uses gemini-2.5-flash-image (Free Tier compatible).
 * Note: 'imageSize' is removed as it's not supported in Flash Image.
 */
export const generateHeroImage = async (
  brandDna: BrandDna, 
  sourceImageBase64: string | null,
  concept: CreativeConcept,
  size: ImageSize
): Promise<string> => {
  const ai = getAiClient();
  
  // Construct a prompt that enforces the Concept's visual direction
  const prompt = `Generate a high-end Facebook Hero Image.
  
  Concept: ${concept.title}
  Visual Direction: ${concept.visualPrompt}
  
  Brand Identity:
  - Name: ${brandDna.name}
  - Style: ${brandDna.visualStyle}
  
  Requirements:
  - Aspect Ratio: 16:9
  - Photorealistic, appetizing food photography.
  - Lighting: Professional studio lighting matching the brand tone (${brandDna.tone}).
  `;

  const parts: any[] = [{ text: prompt }];

  // Pass source food image as reference
  if (sourceImageBase64) {
    const base64Data = sourceImageBase64.split(',')[1] || sourceImageBase64;
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: base64Data }
    });
    parts.push({ text: "Use this image as the primary reference for the food item." });
  }

  // Pass logo as reference if available
  if (brandDna.logoImage) {
    const logoData = brandDna.logoImage.split(',')[1] || brandDna.logoImage;
    parts.push({
      inlineData: { mimeType: 'image/png', data: logoData }
    });
    parts.push({ text: "Use the colors and aesthetic of this logo to style the background or props (do not place the logo explicitly as text)." });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // Switched to Flash Image for free tier compatibility
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
        // imageSize is not supported in Flash Image models
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated.");
};

/**
 * Generates Facebook Post content based on a selected Concept.
 * Uses gemini-2.5-flash.
 */
export const generateFacebookPost = async (
  brandDna: BrandDna,
  concept: CreativeConcept
): Promise<string> => {
  const ai = getAiClient();

  const prompt = `Write a Facebook post for "${brandDna.name}".
  
  Concept Strategy: "${concept.title}"
  Copy Instructions: "${concept.copyAngle}"
  
  Brand DNA:
  - Tone: ${brandDna.tone}
  - Keywords: ${brandDna.keywords.join(', ')}
  - Website: ${brandDna.websiteUrl || 'N/A'}

  Format:
  - Headline (Catchy)
  - Body (Engaging, ~2 paragraphs)
  - Call to Action (Link to website if available)
  - Hashtags
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] }
  });

  return response.text || "Could not generate text.";
};