import {
  createCanvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
} from '@napi-rs/canvas';
import type { GradientOptions } from './types';

export interface SongPreviewOptions {
  width?: number;
  height?: number;
  gradient: GradientOptions;
  track: {
    artworkUrl: string;
    name: string;
    artists: string[];
  };
  progress?: {
    showBar?: boolean;
    duration?: number;
    elapsed?: number;
    color?: string;
  };
}

export async function generatePreviewImage(
  options: SongPreviewOptions
): Promise<Buffer> {
  // Add margin to the original dimensions
  const margin = 8; // Transparent margin size (adjust as needed)
  const width = options.width || 1920;
  const height = options.height || 1080;
  const innerWidth = width - margin * 2;
  const innerHeight = height - margin * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Make the entire canvas transparent initially
  ctx.clearRect(0, 0, width, height);

  // Create a rounded rectangle for the entire background
  const cornerRadius = 24; // Radius for the entire image corners
  ctx.beginPath();
  ctx.moveTo(margin + cornerRadius, margin);
  ctx.arcTo(
    margin + innerWidth,
    margin,
    margin + innerWidth,
    margin + innerHeight,
    cornerRadius
  );
  ctx.arcTo(
    margin + innerWidth,
    margin + innerHeight,
    margin,
    margin + innerHeight,
    cornerRadius
  );
  ctx.arcTo(margin, margin + innerHeight, margin, margin, cornerRadius);
  ctx.arcTo(margin, margin, margin + innerWidth, margin, cornerRadius);
  ctx.closePath();

  // Clip to this rounded rectangle
  ctx.save();
  ctx.clip();

  // Draw background gradient within the clipped area
  const gradient = createGradient(
    ctx,
    innerWidth,
    innerHeight,
    options.gradient
  );
  ctx.fillStyle = gradient;
  ctx.fillRect(margin, margin, innerWidth, innerHeight);

  // Load and draw artwork with shadow and rounded corners
  try {
    const artwork = await loadImage(options.track.artworkUrl);
    const artworkSize = Math.min(innerWidth, innerHeight) * 0.6;
    // Center in the inner area (accounting for margin)
    const x = margin + (innerWidth - artworkSize) / 2;
    const y = margin + (innerHeight - artworkSize) / 2;

    // Create an offscreen canvas for the artwork with shadow
    const shadowPadding = 40; // Enough space for shadow
    const offscreenCanvas = createCanvas(
      artworkSize + shadowPadding * 2,
      artworkSize + shadowPadding * 2
    );
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // Draw a rounded rectangle on the offscreen canvas
    const radius = 20;
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(shadowPadding + radius, shadowPadding);
    offscreenCtx.arcTo(
      shadowPadding + artworkSize,
      shadowPadding,
      shadowPadding + artworkSize,
      shadowPadding + artworkSize,
      radius
    );
    offscreenCtx.arcTo(
      shadowPadding + artworkSize,
      shadowPadding + artworkSize,
      shadowPadding,
      shadowPadding + artworkSize,
      radius
    );
    offscreenCtx.arcTo(
      shadowPadding,
      shadowPadding + artworkSize,
      shadowPadding,
      shadowPadding,
      radius
    );
    offscreenCtx.arcTo(
      shadowPadding,
      shadowPadding,
      shadowPadding + artworkSize,
      shadowPadding,
      radius
    );
    offscreenCtx.closePath();

    // First clip path on offscreen canvas
    offscreenCtx.save();
    offscreenCtx.clip();

    // Draw the image in clipped area
    offscreenCtx.drawImage(
      artwork,
      shadowPadding,
      shadowPadding,
      artworkSize,
      artworkSize
    );

    offscreenCtx.restore();

    // Now apply shadow to the already clipped and drawn artwork
    // Create a second offscreen canvas for the shadow effect
    const shadowCanvas = createCanvas(
      artworkSize + shadowPadding * 2,
      artworkSize + shadowPadding * 2
    );
    const shadowCtx = shadowCanvas.getContext('2d');

    // Apply shadow settings
    shadowCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    shadowCtx.shadowBlur = 30;
    shadowCtx.shadowOffsetY = 15;

    // Draw the first offscreen canvas onto the shadow canvas
    shadowCtx.drawImage(offscreenCanvas, 0, 0);

    // Draw the shadow canvas onto the main canvas
    ctx.drawImage(shadowCanvas, x - shadowPadding, y - shadowPadding);
  } catch (err) {
    throw new Error(
      `Failed to load artwork: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  // Load font file
  GlobalFonts.registerFromPath(
    './assets/SpotifyMixUI-TitleVariable.ttf',
    'SpotifyMixUITitle'
  );

  // Text styling and positioning
  const textMargin = 48;
  const textX = margin + textMargin;
  const bottomMargin = 40;
  const titleY = margin + innerHeight - bottomMargin - 32;

  // Draw song name (bold, white)
  ctx.font = '700 28px SpotifyMixUITitle';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(options.track.name, textX, titleY);

  // Draw artists with adjusted opacity
  ctx.font = '400 18px SpotifyMixUITitle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(options.track.artists.join(', '), textX, titleY + 28);

  // Draw progress bar if enabled
  if (
    options.progress?.showBar &&
    options.progress?.duration &&
    options.progress?.elapsed
  ) {
    const progress = Math.min(
      options.progress.elapsed / options.progress.duration,
      1
    );

    // Use provided color or default to Spotify green
    const progressColor = options.progress?.color || 'rgba(29, 185, 84, 1)';

    // Extract RGB components from the progress color for glow effect
    let r = 29,
      g = 185,
      b = 84; // Default Spotify green

    if (progressColor.startsWith('#')) {
      // Parse hex color
      const hex = progressColor.slice(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (progressColor.startsWith('rgb')) {
      // Parse rgb/rgba color
      const rgbMatch = progressColor.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        r = parseInt(rgbMatch[0]);
        g = parseInt(rgbMatch[1]);
        b = parseInt(rgbMatch[2]);
      }
    }

    // Make progress bar a thin strip at the bottom
    const progressBarHeight = 2;
    const progressBarY = margin + innerHeight - progressBarHeight;

    // Calculate end position with smooth edge
    const progressWidth = innerWidth * progress;

    // Draw the thin progress bar first
    ctx.fillStyle = progressColor;
    ctx.fillRect(margin, progressBarY, progressWidth, progressBarHeight);

    // Create subtle glow gradient with the same color as progress bar
    const glowHeight = 10;
    const glowY = progressBarY - glowHeight;
    const glowGradient = ctx.createLinearGradient(0, glowY, 0, progressBarY);
    glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    glowGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.15)`);
    glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.3)`);

    // Draw the glow effect
    ctx.fillStyle = glowGradient;
    ctx.globalCompositeOperation = 'lighten'; // Use lighten blend mode for glow
    ctx.fillRect(margin, glowY, progressWidth, glowHeight);

    ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
  }

  // Restore context to remove clipping
  ctx.restore();

  return canvas.toBuffer('image/png');
}

function createGradient(
  ctx: SKRSContext2D,
  width: number,
  height: number,
  gradient: GradientOptions
): CanvasGradient {
  let grd: CanvasGradient;

  if ('type' in gradient && gradient.type === 'radial') {
    grd = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) / 2
    );
  } else {
    if (!gradient.direction) {
      throw new Error('Direction is required for linear gradients');
    }
    const [x1, y1] = getCoordinates(gradient.direction.start, width, height);
    const [x2, y2] = getCoordinates(gradient.direction.end, width, height);
    grd = ctx.createLinearGradient(x1, y1, x2, y2);
  }

  gradient.colors.forEach((color, i) => {
    grd.addColorStop(i / (gradient.colors.length - 1), color);
  });

  return grd;
}

function getCoordinates(
  position: string,
  width: number,
  height: number
): [number, number] {
  switch (position) {
    case 'top':
      return [width / 2, 0];
    case 'bottom':
      return [width / 2, height];
    case 'left':
      return [0, height / 2];
    case 'right':
      return [width, height / 2];
    case 'topleft':
      return [0, 0];
    case 'topright':
      return [width, 0];
    case 'bottomleft':
      return [0, height];
    case 'bottomright':
      return [width, height];
    default:
      return [0, 0];
  }
}
