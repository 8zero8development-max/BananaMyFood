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
  overlayCtas: string[]; // Changed to array of strings
}

export interface AppState {
  brandInput: string;
  brandUrl: string;
  brandLogo: string | null;
  
  // New Manual Inputs
  targetAudience: string;
  customTone: string;
  creativeDirection: string;

  // Food Source Inputs
  productName: string; // New
  sourceImage: string | null; // Base64
  
  brandDna: BrandDna | null;
  
  concepts: CreativeConcept[] | null;
  selectedConcept: CreativeConcept | null;
  selectedCta: string | null; // New: Track which specific CTA was chosen

  isAnalyzing: boolean;
  isAutoFilling: boolean; // New loading state
  isGeneratingImage: boolean;
  isEditingImage: boolean; // New: track edit loading state
  editInput: string; // New: track edit text input
  isGeneratingText: boolean;
  
  generatedImage: string | null;
  generatedText: string | null;
  selectedSize: ImageSize;
  error: string | null;
}