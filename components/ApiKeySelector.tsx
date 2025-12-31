import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export const ApiKeySelector: React.FC<Props> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkKey = async () => {
    setIsLoading(true);
    try {
      // 1. Check if key is already available in environment (e.g. .env file)
      // This bypasses the prompt if the user has manually configured it.
      if (process.env.API_KEY && process.env.API_KEY.length > 0) {
        setHasKey(true);
        setIsLoading(false);
        return;
      }

      // 2. Check IDX/AI Studio environment injection
      const win = window as any;
      if (win.aistudio) {
        const selected = await win.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // 3. Fallback for local dev where neither might be present but we don't want to block
        console.warn("No aistudio instance found and no env key. Assuming dev mode.");
        setHasKey(true); 
      }
    } catch (e) {
      console.error("Error checking API key status:", e);
      // In case of error, we default to allowing access so we don't block valid usage
      setHasKey(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio) {
      try {
        await win.aistudio.openSelectKey();
        // Assume success after dialog closes
        setHasKey(true); 
      } catch (e) {
        console.error("Error selecting key:", e);
        // If the user cancels, we stay on this screen.
        // If it's a "not found" error, it might be an env issue, so we ask them to try again.
        if (e instanceof Error && e.message.includes("Requested entity was not found")) {
            alert("Connection failed. Please try again.");
        }
      }
    } else {
      alert("API Key selection is not available in this environment. Please set API_KEY in your environment variables.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-yellow-500">
        <div className="animate-pulse">Checking Permissions...</div>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold text-white">Connect API Key</h1>
          <p className="text-zinc-400">
            Please connect your Google Gemini API key to continue.
            <br/>
            <span className="text-yellow-500 text-sm font-medium">Free Tier Keys are fully supported.</span>
          </p>
        </div>
        
        <button
          onClick={handleSelectKey}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          Connect API Key
        </button>

        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-zinc-600 hover:text-zinc-400 underline"
        >
          Get a Free API Key
        </a>
      </div>
    );
  }

  return <>{children}</>;
};