import React, { useState, useEffect, useCallback } from 'react';
import ParticleCanvas from './components/ParticleCanvas';
import UIOverlay from './components/UIOverlay';
import { ParticleConfig, Point, GenerationState } from './types';
import { getTextCoordinates, normalizeAiPointsToScreen } from './utils/canvasUtils';
import { generateShapeCoordinates } from './services/geminiService';

const DEFAULT_TEXT = "GEMINI";

const App: React.FC = () => {
  const [targetPoints, setTargetPoints] = useState<Point[]>([]);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    currentPrompt: '',
  });

  // Physics Config - tunable for "feel"
  const config: ParticleConfig = {
    friction: 0.90, // How quickly particles slow down (0-1)
    ease: 0.15, // How quickly they move to target (0-1)
    spacing: 1, // Density control
    radius: 1.5, // Particle size base
    repulsionRadius: 100, // Mouse interaction radius
    repulsionForce: 5, // Force multiplier
  };

  // Initial Load - Show Default Text
  useEffect(() => {
    const handleInitialText = () => {
      const points = getTextCoordinates(DEFAULT_TEXT, window.innerWidth, window.innerHeight, 5);
      setTargetPoints(points);
    };

    handleInitialText();
    
    // Debounced resize handler
    let timeoutId: any;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // If we were showing text, re-generate it for new screen size
        // If we were showing an AI shape, we might want to re-scale the normalized points (todo)
        // For simplicity, we just reset to default text on massive resize to keep layout sane
        handleInitialText(); 
      }, 500);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGenerateText = useCallback((text: string) => {
    setGenerationState(prev => ({ ...prev, error: null, currentPrompt: text }));
    const points = getTextCoordinates(text, window.innerWidth, window.innerHeight, 4);
    if (points.length === 0) {
        setGenerationState(prev => ({ ...prev, error: "Text too small or empty to render." }));
        return;
    }
    setTargetPoints(points);
  }, []);

  const handleGenerateAI = useCallback(async (prompt: string) => {
    setGenerationState({ isGenerating: true, error: null, currentPrompt: prompt });
    
    try {
      const aiPoints = await generateShapeCoordinates(prompt);
      
      if (aiPoints.length === 0) {
        throw new Error("AI returned no points for this shape.");
      }

      const screenPoints = normalizeAiPointsToScreen(
        aiPoints, 
        window.innerWidth, 
        window.innerHeight
      );
      
      setTargetPoints(screenPoints);
    } catch (err: any) {
      setGenerationState(prev => ({ 
        ...prev, 
        error: err.message || "Failed to generate shape. Try a simpler prompt." 
      }));
    } finally {
      setGenerationState(prev => ({ ...prev, isGenerating: false }));
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white">
      <ParticleCanvas targetPoints={targetPoints} config={config} />
      <UIOverlay 
        onGenerateAI={handleGenerateAI}
        onGenerateText={handleGenerateText}
        state={generationState}
      />
    </div>
  );
};

export default App;