import React, { useRef } from 'react';
import { BrandDna } from '../types';
import { Banana, Pizza, Upload, Link as LinkIcon, X, Image as ImageIcon } from 'lucide-react';

interface Props {
  inputValue: string;
  onInputChange: (val: string) => void;
  urlValue: string;
  onUrlChange: (val: string) => void;
  logoValue: string | null;
  onLogoChange: (val: string | null) => void;
  brandDna: BrandDna | null;
}

export const BrandDnaSection: React.FC<Props> = ({
  inputValue,
  onInputChange,
  urlValue,
  onUrlChange,
  logoValue,
  onLogoChange,
  brandDna
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Banana className="w-6 h-6 text-yellow-500" />
          <Pizza className="w-3 h-3 text-red-500 absolute -top-1 -right-1 rotate-12" fill="currentColor" />
        </div>
        <h2 className="text-xl font-bold text-white">Brand DNA</h2>
      </div>
      
      {!brandDna ? (
        <div className="space-y-4 flex-1">
          {/* Text Description */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              className="w-full h-24 bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all resize-none"
              placeholder="E.g., A gritty late-night burger joint for skaters..."
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
            />
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Website URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <input 
                type="url"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 pl-9 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="https://..."
                value={urlValue}
                onChange={(e) => onUrlChange(e.target.value)}
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div>
             <label className="block text-sm text-zinc-400 mb-1">Brand Logo (Optional)</label>
             {!logoValue ? (
               <div 
                 onClick={() => logoInputRef.current?.click()}
                 className="w-full h-16 border border-dashed border-zinc-700 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-800 transition-colors"
               >
                 <Upload className="w-4 h-4 text-zinc-500" />
                 <span className="text-sm text-zinc-500">Upload Logo</span>
                 <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
               </div>
             ) : (
                <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-lg border border-zinc-700">
                  <img src={logoValue} alt="Logo" className="w-10 h-10 object-contain bg-white/10 rounded" />
                  <span className="text-sm text-zinc-300 flex-1 truncate">Logo Uploaded</span>
                  <button onClick={() => onLogoChange(null)} className="p-1 hover:bg-zinc-800 rounded">
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
             )}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 animate-fade-in flex-1">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
               {brandDna.logoImage && (
                 <img src={brandDna.logoImage} className="w-8 h-8 object-contain bg-white/10 rounded-full" alt="Brand Logo" />
               )}
               <div>
                  <h3 className="text-lg font-bold text-yellow-500">{brandDna.name}</h3>
                  {brandDna.websiteUrl && <p className="text-xs text-zinc-500">{brandDna.websiteUrl}</p>}
               </div>
            </div>
            <button 
              onClick={() => onInputChange('')} // Reset triggers parent logic to clear DNA
              className="text-xs text-zinc-500 hover:text-white underline"
            >
              Edit
            </button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-zinc-300 line-clamp-2">{brandDna.description}</p>
            <p className="text-xs text-zinc-500 italic">Visual ID: {brandDna.visualStyle}</p>
            <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-1 text-xs bg-zinc-800 rounded text-yellow-500/80 border border-zinc-700 font-bold">
                {brandDna.tone}
                </span>
                {brandDna.keywords.slice(0, 3).map((k, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-zinc-800 rounded text-zinc-400 border border-zinc-700">
                    #{k}
                </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};