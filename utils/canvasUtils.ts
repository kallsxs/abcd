import { Point } from "../types";

export const getTextCoordinates = (
  text: string, 
  width: number, 
  height: number, 
  density: number = 4
): Point[] => {
  // Create an off-screen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) return [];

  canvas.width = width;
  canvas.height = height;

  // Draw text centered
  const fontSize = Math.min(width / (text.length * 0.7), height * 0.5);
  ctx.font = `900 ${fontSize}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(text, width / 2, height / 2);

  const imageData = ctx.getImageData(0, 0, width, height).data;
  const points: Point[] = [];

  // Scan pixels
  for (let y = 0; y < height; y += density) {
    for (let x = 0; x < width; x += density) {
      const index = (y * width + x) * 4;
      const alpha = imageData[index + 3];

      // If pixel is visible, add a point
      if (alpha > 128) {
        points.push({ x, y });
      }
    }
  }

  return points;
};

export const normalizeAiPointsToScreen = (
  aiPoints: Point[], 
  screenWidth: number, 
  screenHeight: number
): Point[] => {
  if (aiPoints.length === 0) return [];

  // Find bounds of AI points (usually 0-100, but let's be safe)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  aiPoints.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // Calculate scaling to fit 60% of screen
  const scale = Math.min(screenWidth * 0.6 / rangeX, screenHeight * 0.6 / rangeY);
  
  const offsetX = (screenWidth - rangeX * scale) / 2;
  const offsetY = (screenHeight - rangeY * scale) / 2;

  return aiPoints.map(p => ({
    x: (p.x - minX) * scale + offsetX,
    y: (p.y - minY) * scale + offsetY
  }));
};
