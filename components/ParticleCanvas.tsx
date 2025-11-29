import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Point, ParticleConfig } from '../types';

interface Particle {
  x: number;
  y: number;
  tx: number; // Target X
  ty: number; // Target Y
  vx: number;
  vy: number;
  color: string;
  size: number;
}

interface ParticleCanvasProps {
  targetPoints: Point[];
  config: ParticleConfig;
}

const colors = [
  '#38bdf8', // Sky 400
  '#818cf8', // Indigo 400
  '#c084fc', // Purple 400
  '#f472b6', // Pink 400
  '#2dd4bf', // Teal 400
];

const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ targetPoints, config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  
  // Interaction state (Mouse OR Hand)
  const interactionRef = useRef<{ x: number; y: number; active: boolean; type: 'hover' | 'click' }>({ 
    x: 0, y: 0, active: false, type: 'hover' 
  });
  
  const animationFrameRef = useRef<number>(0);
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (!videoRef.current || !window.Hands || !window.Camera) return;

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Landmark 8: Index Finger Tip
        const indexTip = landmarks[8];
        // Landmark 4: Thumb Tip
        const thumbTip = landmarks[4];

        if (indexTip && canvasRef.current) {
          // Map normalized coordinates (0-1) to canvas size
          // NOTE: We mirror X (1 - x) because webcam feels more natural mirrored
          const x = (1 - indexTip.x) * canvasRef.current.width;
          const y = indexTip.y * canvasRef.current.height;

          // Detect Pinch (Distance between thumb and index)
          const pinchDist = Math.hypot(
             (1 - thumbTip.x) - (1 - indexTip.x),
             thumbTip.y - indexTip.y
          );
          
          // Threshold for pinch (approx 5% of screen distance roughly)
          const isPinched = pinchDist < 0.05;

          interactionRef.current = {
            x,
            y,
            active: true,
            type: isPinched ? 'click' : 'hover'
          };
        }
      } else {
        // If no hand detected, disable interaction unless mouse is moving (we could hybridize, 
        // but let's stick to last known or disable)
        // Leaving it 'active: false' causes particles to return to shape
        interactionRef.current.active = false;
      }
    });

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    camera.start()
      .then(() => setCameraActive(true))
      .catch((err: any) => console.error("Camera init error:", err));

    return () => {
       // Cleanup logic if needed, though camera.stop() isn't always exposed cleanly in the simple JS wrapper
    };
  }, []);

  // Initialize or Update Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentParticles = particlesRef.current;
    const newParticles: Particle[] = [];
    const numTargets = targetPoints.length;

    const particleCount = Math.max(numTargets, 2000); 

    for (let i = 0; i < particleCount; i++) {
      let p = currentParticles[i];
      
      let tx, ty;
      if (i < numTargets) {
        tx = targetPoints[i].x;
        ty = targetPoints[i].y;
      } else {
        tx = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5;
        ty = canvas.height / 2 + (Math.random() - 0.5) * canvas.height * 0.5;
      }

      if (!p) {
        p = {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          tx,
          ty,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 2 + 1
        };
      } else {
        p.tx = tx;
        p.ty = ty;
      }
      newParticles.push(p);
    }

    particlesRef.current = newParticles;
  }, [targetPoints]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with trail effect
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const interaction = interactionRef.current;

    // Draw visual cursor/hand guide
    if (interaction.active) {
      ctx.beginPath();
      ctx.arc(interaction.x, interaction.y, 20, 0, Math.PI * 2);
      ctx.strokeStyle = interaction.type === 'click' ? '#f472b6' : '#2dd4bf'; // Pink for pinch, Teal for hover
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Inner dot
      ctx.beginPath();
      ctx.arc(interaction.x, interaction.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = interaction.type === 'click' ? '#f472b6' : '#2dd4bf';
      ctx.fill();
    }

    particles.forEach(p => {
      // Physics: Move towards target
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      
      p.vx += dx * config.ease;
      p.vy += dy * config.ease;

      // Interaction (Hand or Mouse)
      if (interaction.active) {
        const mdx = interaction.x - p.x;
        const mdy = interaction.y - p.y;
        const dist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (dist < config.repulsionRadius) {
          const force = (config.repulsionRadius - dist) / config.repulsionRadius;
          const angle = Math.atan2(mdy, mdx);
          
          if (interaction.type === 'click') {
             // Attraction (Black hole effect / Pinch)
             p.vx += Math.cos(angle) * force * config.repulsionForce * 2;
             p.vy += Math.sin(angle) * force * config.repulsionForce * 2;
          } else {
             // Repulsion (Scatter / Open Hand)
             p.vx -= Math.cos(angle) * force * config.repulsionForce;
             p.vy -= Math.sin(angle) * force * config.repulsionForce;
          }
        }
      }

      // Friction
      p.vx *= config.friction;
      p.vy *= config.friction;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Draw
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = speed > 5 ? '#ffffff' : p.color;
      ctx.fill();
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [config]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start Animation Loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [animate]);

  // Fallback Mouse Handlers (only used if camera isn't overriding)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cameraActive) {
      interactionRef.current = { ...interactionRef.current, x: e.clientX, y: e.clientY, active: true, type: 'hover' };
    }
  };
  const handleMouseDown = () => {
    if (!cameraActive) interactionRef.current.type = 'click';
  }
  const handleMouseUp = () => {
    if (!cameraActive) interactionRef.current.type = 'hover';
 }
  const handleMouseLeave = () => {
    if (!cameraActive) interactionRef.current.active = false;
  };

  return (
    <>
      <video ref={videoRef} className="input_video" playsInline></video>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="absolute top-0 left-0 w-full h-full cursor-none touch-none"
      />
    </>
  );
};

export default ParticleCanvas;