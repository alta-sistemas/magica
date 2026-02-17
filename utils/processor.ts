import { HalftoneShape, ProcessingSettings } from '../types';

/**
 * Processes the image data: 
 * 1. Removes black background and places valid pixels on canvas.
 * 2. Applies Halftone pattern as a 'knockout' mask (erasing parts) to create breathability.
 */
export const processImage = (
  ctx: CanvasRenderingContext2D,
  originalImage: HTMLImageElement,
  settings: ProcessingSettings,
  width: number,
  height: number
): void => {
  // --- Step 1: Prepare the Base Image (Black Removal & Color) ---
  
  // Create an offscreen canvas to process the raw pixel data first
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // Draw original to temp to get data
  tempCtx.drawImage(originalImage, 0, 0, width, height);
  const rawData = tempCtx.getImageData(0, 0, width, height);
  const data = rawData.data;
  
  // Parse mono color if needed
  let monoR = 255, monoG = 255, monoB = 255;
  if (settings.colorMode === 'mono') {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(settings.monoColor);
    if (result) {
      monoR = parseInt(result[1], 16);
      monoG = parseInt(result[2], 16);
      monoB = parseInt(result[3], 16);
    }
  }

  // Iterate pixels to remove black and apply mono color
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // If already transparent, skip
    if (a === 0) continue;

    const maxVal = Math.max(r, g, b);
    
    // Black Removal Threshold
    if (maxVal <= settings.blackThreshold) {
      data[i + 3] = 0; // Make transparent
    } else {
      // Apply Mono Color if selected
      if (settings.colorMode === 'mono') {
        data[i] = monoR;
        data[i + 1] = monoG;
        data[i + 2] = monoB;
        // Keep alpha
      }
    }
  }

  // Put the processed image onto the Main Canvas
  tempCtx.putImageData(rawData, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);

  // --- Step 2: Apply Halftone as Eraser (Knockout) ---
  
  ctx.globalCompositeOperation = 'destination-out'; // Drawing now ERASES content
  ctx.fillStyle = '#000000'; // Color doesn't matter in destination-out, opacity does

  const gridSize = Math.max(2, Math.floor(settings.gridSize));
  const halfGrid = gridSize / 2;
  const PI = Math.PI;

  // We use the processed data to determine where to punch holes
  // NOTE: data[] was modified in place above, so it represents the image currently on canvas
  
  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      
      // Calculate average brightness of this cell to determine hole size
      let totalBrightness = 0;
      let count = 0;

      for (let sy = 0; sy < gridSize; sy++) {
        for (let sx = 0; sx < gridSize; sx++) {
          const px = x + sx;
          const py = y + sy;
          
          if (px < width && py < height) {
            const idx = (py * width + px) * 4;
            // Only count non-transparent pixels
            if (data[idx + 3] > 0) {
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              // Luminance
              totalBrightness += (r + g + b) / 3;
              count++;
            }
          }
        }
      }

      if (count === 0) continue; // No ink here, no need to punch holes

      const avgBrightness = totalBrightness / count;
      const normalizedBrightness = avgBrightness / 255;

      // Calculate Hole Size Factor
      // Logic: 
      // Bright areas (High Ink) -> Small Holes (Solid look)
      // Dark areas (Shadows) -> Large Holes (Fade out / Breathable)
      // settings.intensity controls the overall "openness" of the mesh
      
      // Base hole size is determined by intensity
      // We modulate it: (1 - brightness) makes dark areas have bigger holes
      // The 0.7 factor ensures even pure white has *some* hole (breathability)
      // If invert is true: Bright areas get big holes (negative image effect)
      
      let holeSizeFactor;
      
      if (!settings.invert) {
         // Standard DTF: Darker = Bigger Hole
         // We dampen the brightness effect slightly so white isn't 100% solid (needs breathability)
         holeSizeFactor = settings.intensity * (1 - (normalizedBrightness * 0.7)); 
      } else {
         // Inverted: Lighter = Bigger Hole
         holeSizeFactor = settings.intensity * (0.2 + (normalizedBrightness * 0.8));
      }

      // Clamp size to avoid overlapping weirdness or negative radius
      // maxRadius is usually grid/2 * sqrt(2) to cover corners, but for holes we usually want separation
      const maxRadius = (gridSize / 2) * 1.5; 
      const size = Math.max(0, maxRadius * holeSizeFactor);
      
      if (size <= 0.1) continue;

      const centerX = x + halfGrid;
      const centerY = y + halfGrid;

      ctx.beginPath();
      
      switch (settings.shape) {
        case HalftoneShape.CIRCLE:
          ctx.arc(centerX, centerY, size, 0, 2 * PI);
          break;
        case HalftoneShape.SQUARE:
          ctx.rect(centerX - size, centerY - size, size * 2, size * 2);
          break;
        case HalftoneShape.DIAMOND:
          ctx.moveTo(centerX, centerY - size * 1.4);
          ctx.lineTo(centerX + size * 1.4, centerY);
          ctx.lineTo(centerX, centerY + size * 1.4);
          ctx.lineTo(centerX - size * 1.4, centerY);
          break;
        case HalftoneShape.LINE:
           // For lines, we punch horizontal stripes
           // height of stripe depends on size
           const h = Math.min(gridSize - 1, size * 2);
           ctx.rect(x, centerY - h/2, gridSize, h);
           break;
      }
      
      ctx.fill();
    }
  }

  // Restore drawing mode
  ctx.globalCompositeOperation = 'source-over';
};