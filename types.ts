export enum ImageSize {
  Size1K = '1K',
  Size2K = '2K',
  Size4K = '4K'
}

export enum AspectRatio {
  Square = '1:1',
  Landscape = '16:9',
  Portrait = '9:16'
}

export interface GeneratedContent {
  imageUrl?: string;
  postText?: string;
}

export interface BrandDna {
  name: string;
  description: string;
  websiteUrl?: string;
  logoImage?: string; // Base64
  tone: string;
  keywords: string[];
  visualStyle: string; // Extracted from logo/desc
}

export interface CreativeConcept {
  id: string;
  title: string;
  rationale: string;
  visualPrompt: string;
  copyAngle: string;
  overlayCta: string; // New: Short text to overlay on image
}

export interface AppState {
  brandInput: string;
  brandUrl: string;
  brandLogo: string | null;
  brandDna: BrandDna | null;
  
  sourceImage: string | null; // Base64
  
  concepts: CreativeConcept[] | null;
  selectedConcept: CreativeConcept | null;

  isAnalyzing: boolean;
  isGeneratingImage: boolean;
  isGeneratingText: boolean;
  
  generatedImage: string | null;
  generatedText: string | null;
  selectedSize: ImageSize;
  error: string | null;
}