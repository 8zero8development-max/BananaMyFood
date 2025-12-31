import { GoogleGenAI, Type } from "@google/genai";
import { BrandDna, ImageSize, CreativeConcept } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Quickly infers audience, tone, and direction from basic description/URL.
 * Used to auto-fill the brief inputs.
 */
export const autoFillBrief = async (
  description: string,
  websiteUrl: string
): Promise<{ brandDescription: string; audience: string; tone: string; direction: string; logoUrl?: string }> => {
  const ai = getAiClient();
  
  const prompt = `Based on the brand description and URL provided, research the brand to infer details and find their official logo.
  
  Description: "${description}"
  URL: "${websiteUrl}"
  
  Task:
  1. Write a short, engaging "Brand Description" (if one wasn't provided, create it based on the URL name; if provided, refine it).
  2. Return short, punchy summaries for Audience, Tone, and Direction.
  3. Search for a direct URL to the brand's logo (preferably PNG or JPG on a transparent background).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ text: prompt }] },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          brandDescription: { type: Type.STRING, description: "A concise 1-2 sentence description of what the brand is." },
          audience: { type: Type.STRING, description: "e.g., Gen-Z foodies, Corporate lunch crowds" },
          tone: { type: Type.STRING, description: "e.g., Witty, Premium, Rustic, High-Energy" },
          direction: { type: Type.STRING, description: "e.g., Neon-noir street food vibe, Clean minimalist daylight" },
          logoUrl: { type: Type.STRING, description: "A direct http URL to the brand's logo image file." }
        },
        required: ["brandDescription", "audience", "tone", "direction"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text);
};

/**
 * Analyzes brand inputs (Text, URL, Logo, Source Image) to produce structured Brand DNA.
 */
export const researchBrandDna = async (
  description: string, 
  websiteUrl: string, 
  logoBase64: string | null,
  sourceImageBase64: string | null,
  productName: string,
  targetAudience?: string,
  customTone?: string,
  creativeDirection?: string
): Promise<BrandDna> => {
  const ai = getAiClient();
  
  let prompt = `Analyze the provided brand assets to extract a structured Brand DNA profile.
  
  Inputs:
  - Description: "${description}"
  - Website: "${websiteUrl}"
  ${targetAudience ? `- Target Audience: "${targetAudience}"` : ""}
  ${customTone ? `- Desired Tone: "${customTone}"` : ""}
  ${creativeDirection ? `- Creative Direction: "${creativeDirection}"` : ""}
  ${productName ? `- Product Name: "${productName}"` : ""}
  ${logoBase64 ? "- A logo image is attached." : ""}
  ${sourceImageBase64 ? "- A sample product/food photo is attached." : ""}

  Task:
  1. Infer the Brand Name if not explicitly stated.
  2. Analyze the visual style (colors, fonts, lighting, plating, vibe) from the logo, sample product photo, and the Creative Direction input.
  3. Determine the final Tone of Voice (prioritizing the Desired Tone if provided).
  4. Extract key themes/keywords relevant to the Target Audience.
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
          visualStyle: { type: Type.STRING, description: "Description of colors, shapes, and visual identity inferred from logo/desc/photo/direction" },
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
 * Updated to return 3 CTA options per concept.
 */
export const generateCreativeConcepts = async (
  brandDna: BrandDna,
  sourceImageBase64: string,
  productName: string
): Promise<CreativeConcept[]> => {
  const ai = getAiClient();
  const base64Data = sourceImageBase64.split(',')[1] || sourceImageBase64;

  const prompt = `You are a world-class Art Director & Graphic Designer. 
  
  Context:
  We need to design a professional Advertising Poster for "${brandDna.name}" featuring "${productName || 'our product'}".
  
  Brand DNA:
  - Tone: ${brandDna.tone}
  - Visual Style: ${brandDna.visualStyle}
  - Keywords: ${brandDna.keywords.join(', ')}

  Task:
  Analyze the attached food image. Generate 3 DISTINCT Art Direction concepts for a Social Media Ad.
  
  Focus on LAYOUT, TYPOGRAPHY, and COMPOSITION. We want these to look like high-end ads, not just plain photos.
  Think: Magazine Ads, Billboards, Pop-Art, Modern Minimalist, 90s Retro, etc.

  For each concept, provide:
  1. Title: A short internal name for the concept.
  2. Rationale: Why this layout/style works for the brand.
  3. VisualPrompt: A highly detailed prompt describing a "Professional Advertising Poster". Include details about typography style, background graphics, color palette, and how the text/logo should be integrated.
  4. CopyAngle: Instructions for the copywriter.
  5. OverlayCtas: Provide 3 distinct, punchy headline options (2-5 words) that could be rendered on the image. (e.g. "100% REAL BEEF", "TASTE THE CRUNCH", "GRILLED PERFECTION").
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
            overlayCtas: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["id", "title", "rationale", "visualPrompt", "copyAngle", "overlayCtas"]
        }
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate concepts");
  return JSON.parse(response.text) as CreativeConcept[];
};

/**
 * Generates the final Hero Image.
 * Accepts specific ctaText to render.
 */
export const generateHeroImage = async (
  brandDna: BrandDna, 
  sourceImageBase64: string | null,
  concept: CreativeConcept,
  size: ImageSize,
  productName: string,
  ctaText: string
): Promise<string> => {
  const ai = getAiClient();
  
  // Updated Prompt for Full Composition
  const prompt = `Design a professional, high-quality advertising poster.
  
  Subject: ${productName || 'Food Item'}
  Style/Concept: ${concept.title}
  Art Direction: ${concept.visualPrompt}
  
  CRITICAL LAYOUT INSTRUCTIONS:
  1. TEXT: Render the headline "${ctaText}" directly into the image. Use bold, professional typography that matches the art direction. Ensure the text is legible and integrated into the design (e.g., behind the burger, interacting with elements, or in a stylized badge).
  2. BRANDING: I have provided the brand logo. Incorporate this logo naturally into the composition (e.g., in the corner or as a design element).
  3. FOOD: The food should look appetizing and premium.
  
  Brand Identity:
  - Name: ${brandDna.name}
  - Vibe: ${brandDna.visualStyle}
  
  Output: A seamless, finished advertisement graphic (Aspect Ratio 16:9).
  `;

  const parts: any[] = [{ text: prompt }];

  // 1. Pass source food image
  if (sourceImageBase64) {
    const base64Data = sourceImageBase64.split(',')[1] || sourceImageBase64;
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: base64Data }
    });
    parts.push({ text: `REFERENCE IMAGE 1 (Product): Use this as the main subject.` });
  }

  // 2. Pass logo as reference for COMPOSITION
  if (brandDna.logoImage) {
    const logoData = brandDna.logoImage.split(',')[1] || brandDna.logoImage;
    parts.push({
      inlineData: { mimeType: 'image/png', data: logoData }
    });
    parts.push({ text: "REFERENCE IMAGE 2 (Logo): Place this logo in the design or redraw it to match the style." });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
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
 * Modifies an existing generated image based on a text instruction.
 * Uses gemini-2.5-flash-image for image-to-image editing.
 */
export const editHeroImage = async (
  currentImageBase64: string,
  editInstruction: string
): Promise<string> => {
  const ai = getAiClient();
  // Strip potential prefix to get raw base64
  const base64Data = currentImageBase64.split(',')[1] || currentImageBase64;

  const prompt = `Edit this image. Instruction: ${editInstruction}. Maintain the high-quality professional advertising aesthetic, the layout, and the aspect ratio.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png', // Generated images are typically png
            data: base64Data
          }
        },
        { text: prompt }
      ]
    },
    config: {
        imageConfig: {
            aspectRatio: "16:9"
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
 * Generates Facebook Post content.
 */
export const generateFacebookPost = async (
  brandDna: BrandDna,
  concept: CreativeConcept,
  productName: string
): Promise<string> => {
  const ai = getAiClient();

  const prompt = `Write a Facebook post for "${brandDna.name}" promoting the "${productName || 'new item'}".
  
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