import React, { useState, useRef } from 'react';
import { ApiKeySelector } from './components/ApiKeySelector';
import { BrandDnaSection } from './components/BrandDnaSection';
import { ImageCapture } from './components/ImageCapture';
import { researchBrandDna, generateCreativeConcepts, generateHeroImage, editHeroImage, generateFacebookPost, autoFillBrief } from './services/geminiService';
import { AppState, BrandDna, ImageSize, CreativeConcept } from './types';
import { Send, ImageIcon, Share2, Wand2, RefreshCcw, Copy, Sparkles, ArrowRight, ArrowLeft, CheckCircle, Download, Terminal, Edit2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    brandInput: '',
    brandUrl: '',
    brandLogo: null,
    
    // New Manual Inputs
    targetAudience: '',
    customTone: '',
    creativeDirection: '',

    // Food Source Inputs
    productName: '',
    sourceImage: null,

    brandDna: null,
    concepts: null,
    selectedConcept: null,
    selectedCta: null,
    
    isAnalyzing: false,
    isAutoFilling: false,
    isGeneratingImage: false,
    isEditingImage: false,
    editInput: '',
    isGeneratingText: false,
    generatedImage: null,
    generatedText: null,
    selectedSize: ImageSize.Size1K,
    error: null
  });

  // Ref for the image container to capture for download
  const resultImageContainerRef = useRef<HTMLDivElement>(null);

  const resetState = () => {
      setState(s => ({
          ...s,
          brandDna: null,
          concepts: null,
          selectedConcept: null,
          selectedCta: null,
          generatedImage: null,
          generatedText: null
      }));
  };

  /**
   * Helper to convert an image URL to Base64.
   * Note: This will likely fail for many URLs due to CORS unless a proxy is used.
   * For the demo, we attempt it, and handle failure gracefully.
   */
  const convertUrlToBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Could not fetch logo due to CORS or network error:", e);
        return null;
    }
  };

  const handleAutoFill = async () => {
    if (!state.brandInput && !state.brandUrl) {
      setState(s => ({ ...s, error: "Enter a description or URL to auto-fill the brief." }));
      return;
    }
    
    setState(s => ({ ...s, isAutoFilling: true, error: null }));
    
    try {
        const result = await autoFillBrief(state.brandInput, state.brandUrl);
        
        let logoBase64: string | null = state.brandLogo;

        // If AI found a logo URL and we don't have one yet, try to fetch it
        if (result.logoUrl && !state.brandLogo) {
             const fetchedLogo = await convertUrlToBase64(result.logoUrl);
             if (fetchedLogo) {
                 logoBase64 = fetchedLogo;
             }
        }

        setState(s => ({
            ...s,
            brandInput: result.brandDescription,
            targetAudience: result.audience,
            customTone: result.tone,
            creativeDirection: result.direction,
            brandLogo: logoBase64,
            isAutoFilling: false
        }));
    } catch (e: any) {
        setState(s => ({ ...s, error: `Auto-fill failed: ${e.message}`, isAutoFilling: false }));
    }
  };

  const handleAnalysisAndIdeation = async () => {
    if (!state.brandInput && !state.brandUrl) {
        setState(s => ({ ...s, error: "Please provide a brand description or URL." }));
        return;
    }
    if (!state.sourceImage) {
        setState(s => ({ ...s, error: "Please upload or capture a food image." }));
        return;
    }

    setState(s => ({ ...s, isAnalyzing: true, error: null }));

    try {
      // 1. Analyze Brand DNA (uses 2.5 Flash - Free/Fast)
      // Now passing the new manual inputs to guide the analysis
      const dna = await researchBrandDna(
          state.brandInput, 
          state.brandUrl, 
          state.brandLogo, 
          state.sourceImage,
          state.productName,
          state.targetAudience,
          state.customTone,
          state.creativeDirection
      );
      
      // 2. Generate Concepts based on DNA + Image (uses 2.5 Flash - Free/Fast)
      const concepts = await generateCreativeConcepts(dna, state.sourceImage, state.productName);

      setState(s => ({ 
          ...s, 
          brandDna: dna, 
          concepts: concepts,
          isAnalyzing: false 
      }));
    } catch (e: any) {
      setState(s => ({ ...s, error: e.message || "Failed to analyze.", isAnalyzing: false }));
    }
  };

  const handleFinalGeneration = async (concept: CreativeConcept, chosenCta: string) => {
    if (!state.brandDna) return;
    
    setState(s => ({ 
        ...s, 
        selectedConcept: concept,
        selectedCta: chosenCta,
        isGeneratingImage: true, 
        isGeneratingText: true, 
        error: null,
        // clear previous results if any
        generatedImage: null,
        generatedText: null
    }));

    // Trigger parallel generation
    try {
        generateHeroImage(state.brandDna, state.sourceImage, concept, state.selectedSize, state.productName, chosenCta)
            .then(imgUrl => setState(s => ({ ...s, generatedImage: imgUrl, isGeneratingImage: false })))
            .catch(e => setState(s => ({ ...s, error: `Image Gen Error: ${e.message}`, isGeneratingImage: false })));

        generateFacebookPost(state.brandDna, concept, state.productName)
            .then(text => setState(s => ({ ...s, generatedText: text, isGeneratingText: false })))
            .catch(e => setState(s => ({ ...s, error: `Text Gen Error: ${e.message}`, isGeneratingText: false })));
            
    } catch (e: any) {
        setState(s => ({ ...s, error: e.message, isGeneratingImage: false, isGeneratingText: false }));
    }
  };

  const handleEditImage = async () => {
    if (!state.generatedImage || !state.editInput) return;
    
    setState(s => ({ ...s, isEditingImage: true, error: null }));
    
    try {
        const newImage = await editHeroImage(state.generatedImage, state.editInput);
        setState(s => ({
            ...s,
            generatedImage: newImage,
            isEditingImage: false,
            editInput: '' // Clear input on success
        }));
    } catch (e: any) {
        setState(s => ({ ...s, error: `Edit failed: ${e.message}`, isEditingImage: false }));
    }
  };

  /**
   * Direct download of the generated image since text/logo are now baked in by AI.
   */
  const handleDownloadComposite = () => {
    if (!state.generatedImage) return;

    const link = document.createElement('a');
    link.download = `poster-${state.brandDna?.name || 'brand'}.png`;
    link.href = state.generatedImage;
    link.click();
  };

  // Construct the prompt used for generation for display
  const getPromptText = () => {
    if (!state.selectedConcept || !state.brandDna || !state.selectedCta) return '';
    return `Design a professional, high-quality advertising poster.
  
Subject: ${state.productName || 'Food Item'}
Style/Concept: ${state.selectedConcept.title}
Art Direction: ${state.selectedConcept.visualPrompt}

CRITICAL: Render headline "${state.selectedCta}" directly in image.
Incorporating provided logo.`;
  };

  return (
    <ApiKeySelector>
      <div className="min-h-screen bg-zinc-950 pb-20 font-sans">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                <img 
                  src="/banana-logo.png" 
                  alt="Banana Logo" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    // Fallback to text if image is missing
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerText = '🍌';
                  }}
                />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">
                <span className="text-yellow-500">Banana</span> my food socials
              </h1>
            </div>
            {state.concepts && (
                <button onClick={resetState} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
                    <RefreshCcw className="w-4 h-4" /> New Project
                </button>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 space-y-8">
          
          {/* Error Banner */}
          {state.error && (
            <div className="bg-red-900/30 border border-red-800 text-red-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
               <span className="text-xl">⚠️</span>
               <p>{state.error}</p>
               <button onClick={() => setState(s => ({...s, error: null}))} className="ml-auto text-sm hover:underline">Dismiss</button>
            </div>
          )}

          {/* PHASE 1: INPUTS */}
          {!state.concepts && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto">
                    <BrandDnaSection 
                        inputValue={state.brandInput}
                        onInputChange={(val) => setState(s => ({ ...s, brandInput: val }))}
                        urlValue={state.brandUrl}
                        onUrlChange={(val) => setState(s => ({ ...s, brandUrl: val }))}
                        logoValue={state.brandLogo}
                        onLogoChange={(val) => setState(s => ({ ...s, brandLogo: val }))}
                        
                        targetAudience={state.targetAudience}
                        onTargetAudienceChange={(val) => setState(s => ({ ...s, targetAudience: val }))}
                        customTone={state.customTone}
                        onCustomToneChange={(val) => setState(s => ({ ...s, customTone: val }))}
                        creativeDirection={state.creativeDirection}
                        onCreativeDirectionChange={(val) => setState(s => ({ ...s, creativeDirection: val }))}
                        
                        onAutoFill={handleAutoFill}
                        isAutoFilling={state.isAutoFilling}
                        brandDna={state.brandDna}
                    />
                    <ImageCapture 
                        image={state.sourceImage}
                        onImageCapture={(base64) => setState(s => ({ ...s, sourceImage: base64 }))}
                        productName={state.productName}
                        onProductNameChange={(val) => setState(s => ({ ...s, productName: val }))}
                    />
                </div>

                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleAnalysisAndIdeation}
                        disabled={state.isAnalyzing || (!state.brandInput && !state.brandUrl) || !state.sourceImage}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold text-lg py-4 px-12 rounded-full shadow-xl shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        {state.isAnalyzing ? (
                            <>
                                <Sparkles className="animate-spin w-6 h-6" />
                                <span>Analyzing DNA & Ideating...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-6 h-6" />
                                <span>Generate Creative Concepts</span>
                            </>
                        )}
                    </button>
                </div>
              </div>
          )}

          {/* PHASE 2: CONCEPT SELECTION */}
          {state.concepts && !state.selectedConcept && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-6">
                  <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-white">Choose a Direction</h2>
                      <p className="text-zinc-400">Select a headline style to generate your poster.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {state.concepts.map((concept) => (
                          <div 
                            key={concept.id}
                            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col group hover:border-zinc-700 transition-colors"
                          >
                              <h3 className="text-xl font-bold text-white mb-2 text-yellow-500">{concept.title}</h3>
                              <p className="text-zinc-400 text-sm mb-4 flex-1 border-b border-zinc-800 pb-4">{concept.rationale}</p>
                              <div className="space-y-3">
                                <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Select a Headline:</div>
                                {concept.overlayCtas.map((cta, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleFinalGeneration(concept, cta)}
                                        className="w-full text-left text-sm font-bold text-zinc-300 bg-zinc-800 hover:bg-yellow-500 hover:text-black p-3 rounded-lg border border-zinc-700 hover:border-yellow-500 transition-all active:scale-95"
                                    >
                                        "{cta}"
                                    </button>
                                ))}
                              </div>
                          </div>
                      ))}
                  </div>
                  
                  <div className="flex justify-center mt-6">
                       <button onClick={resetState} className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm">
                           <ArrowLeft className="w-4 h-4" /> Go Back
                       </button>
                  </div>
              </div>
          )}

          {/* PHASE 3: FINAL RESULTS */}
          {state.selectedConcept && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {state.selectedConcept.title}
                            <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-bold uppercase">Selected</span>
                        </h2>
                        <p className="text-zinc-500 text-sm">Using headline: <span className="text-zinc-300">"{state.selectedCta}"</span></p>
                    </div>
                    <button onClick={() => setState(s => ({ ...s, selectedConcept: null, selectedCta: null, generatedImage: null, generatedText: null }))} className="text-zinc-400 hover:text-white text-sm">
                        Change Concept
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Hero Image Result */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                             <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-yellow-500" /> Facebook Hero
                             </h3>
                        </div>
                        
                        <div ref={resultImageContainerRef} className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 group shadow-lg">
                            {state.isGeneratingImage || state.isEditingImage ? (
                                <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 z-10 bg-zinc-900/80 backdrop-blur-sm">
                                    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-zinc-500 text-sm animate-pulse">
                                        {state.isEditingImage ? "Applying edits..." : "Designing Poster & Typography..."}
                                    </p>
                                </div>
                            ) : state.generatedImage ? (
                                <>
                                    {/* Generated Base Image (Now contains text/logo) */}
                                    <img src={state.generatedImage} alt="Generated Hero" className="w-full h-full object-cover" />
                                    
                                    {/* Download Button overlay */}
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button 
                                            onClick={handleDownloadComposite}
                                            className="bg-black/80 hover:bg-black text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md flex items-center gap-2 border border-white/10"
                                        >
                                            <Download className="w-4 h-4" /> Download Poster
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-700">Generation failed</div>
                            )}
                        </div>

                        {/* Edit Image Input Group */}
                        {state.generatedImage && !state.isGeneratingImage && !state.isEditingImage && (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Edit2 className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 pl-9 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                                        placeholder="E.g. Add more smoke, change background to blue..."
                                        value={state.editInput}
                                        onChange={(e) => setState(s => ({ ...s, editInput: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleEditImage();
                                        }}
                                    />
                                </div>
                                <button 
                                    onClick={handleEditImage}
                                    disabled={!state.editInput}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-yellow-500 font-bold px-4 rounded-lg text-sm border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Edit
                                </button>
                            </div>
                        )}

                         {/* Prompt Display Section */}
                         {state.generatedImage && (
                             <div className="mt-4 bg-zinc-900 rounded-xl border border-zinc-800 p-4 relative group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-3 h-3 text-zinc-500" />
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Image Prompt</h4>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const text = getPromptText();
                                            navigator.clipboard.writeText(text);
                                        }}
                                        className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded transition-colors"
                                    >
                                        <Copy className="w-3 h-3" /> Copy Prompt
                                    </button>
                                </div>
                                <div className="bg-zinc-950 rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar border border-zinc-900">
                                    <p className="text-zinc-400 text-xs font-mono whitespace-pre-wrap">
                                        {getPromptText()}
                                    </p>
                                </div>
                            </div>
                         )}
                    </div>

                    {/* Post Content Result */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                            <Send className="w-4 h-4 text-yellow-500" /> Facebook Post
                        </h3>
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 relative group h-full shadow-lg flex flex-col">
                            {state.isGeneratingText ? (
                                <div className="flex flex-col gap-3 flex-1 justify-center">
                                    <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-zinc-800 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-zinc-800 rounded w-5/6 animate-pulse"></div>
                                </div>
                            ) : state.generatedText ? (
                                <>
                                    <pre className="whitespace-pre-wrap font-sans text-zinc-300 text-base leading-relaxed flex-1">
                                        {state.generatedText}
                                    </pre>
                                    <button 
                                    onClick={() => navigator.clipboard.writeText(state.generatedText || '')}
                                    className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    title="Copy to clipboard"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-zinc-700 italic">Generation failed</div>
                            )}
                        </div>
                    </div>
                </div>
                
                {(!state.isGeneratingImage && !state.isGeneratingText) && (
                     <div className="flex justify-center pt-8 border-t border-zinc-800">
                         <div className="text-zinc-500 text-sm flex items-center gap-2">
                             <CheckCircle className="w-4 h-4 text-green-500" /> Generation Complete
                         </div>
                     </div>
                )}

             </div>
          )}

        </main>
      </div>
    </ApiKeySelector>
  );
};

export default App;