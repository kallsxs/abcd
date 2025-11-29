import React, { useState } from 'react';
import { Sparkles, Type, Loader2, Hand, AlertCircle } from 'lucide-react';
import { GenerationState } from '../types';

interface UIOverlayProps {
  onGenerateAI: (prompt: string) => void;
  onGenerateText: (text: string) => void;
  state: GenerationState;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ onGenerateAI, onGenerateText, state }) => {
  const [mode, setMode] = useState<'ai' | 'text'>('text');
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (mode === 'ai') {
      onGenerateAI(input);
    } else {
      onGenerateText(input);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6">
      {/* Header */}
      <div className="pointer-events-auto flex justify-between items-start">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white max-w-sm shadow-2xl">
          <h1 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            <Sparkles size={20} className="text-cyan-400" />
            AI Particle Shifter
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Show your hand to the camera to interact.
          </p>
          <div className="flex flex-col gap-2 mt-3 text-xs text-gray-500">
             <div className="flex items-center gap-2"><Hand size={14}/> <b>Move Hand</b> to scatter particles</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-pink-400"/> <b>Pinch Fingers</b> to attract (Black Hole)</div>
          </div>
        </div>
      </div>

      {/* Input Control */}
      <div className="pointer-events-auto w-full flex flex-col items-center mb-8">
        {state.error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle size={16}/> {state.error}
            </div>
        )}

        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col gap-2 w-full max-w-md shadow-2xl ring-1 ring-white/5">
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setMode('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === 'text' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Type size={16} /> Text
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                mode === 'ai' ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/20 shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={16} /> AI Shape
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'ai' ? "e.g., A cat, A lightning bolt..." : "Enter text..."}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              maxLength={40}
            />
            <button
              type="submit"
              disabled={state.isGenerating || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;