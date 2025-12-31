import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  image: string | null;
  onImageCapture: (base64: string | null) => void;
}

export const ImageCapture: React.FC<Props> = ({ image, onImageCapture }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-white">Food Source</h2>
      </div>

      {!image ? (
        <div 
          onClick={() => inputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-zinc-800 transition-all group"
        >
          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-6 h-6 text-zinc-400 group-hover:text-yellow-500" />
          </div>
          <p className="text-zinc-400 font-medium group-hover:text-white">Tap to take photo or upload</p>
          <p className="text-zinc-600 text-sm mt-1">Supports JPG, PNG</p>
          <input 
            ref={inputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black">
          <img src={image} alt="Source food" className="w-full h-48 object-cover opacity-80" />
          <button 
            onClick={() => {
              onImageCapture(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-xs font-mono text-yellow-500 font-bold ml-1">SOURCE_IMAGE_LOADED</span>
          </div>
        </div>
      )}
    </div>
  );
};