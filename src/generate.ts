import {
  createCanvas,
  loadImage,
  SKRSContext2D,
  GlobalFonts,
} from '@napi-rs/canvas';
import type { GradientOptions, SongPreviewOptions } from './types';

async function drawArtwork(
  ctx: SKRSContext2D,
  artwork: any,
  x: number,
  y: number,
  artworkSize: number
): Promise<void> {
  const shadowPadding = 40;
  const offscreenCanvas = createCanvas(
    artworkSize + shadowPadding * 2,
    artworkSize + shadowPadding * 2
  );
  const offscreenCtx = offscreenCanvas.getContext('2d');

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

  offscreenCtx.save();
  offscreenCtx.clip();

  offscreenCtx.drawImage(
    artwork,
    shadowPadding,
    shadowPadding,
    artworkSize,
    artworkSize
  );

  offscreenCtx.restore();

  const shadowCanvas = createCanvas(
    artworkSize + shadowPadding * 2,
    artworkSize + shadowPadding * 2
  );
  const shadowCtx = shadowCanvas.getContext('2d');

  shadowCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  shadowCtx.shadowBlur = 30;
  shadowCtx.shadowOffsetY = 15;

  shadowCtx.drawImage(offscreenCanvas, 0, 0);

  ctx.drawImage(shadowCanvas, x - shadowPadding, y - shadowPadding);
}

export async function generatePreviewImage(
  options: SongPreviewOptions
): Promise<Buffer> {
  // Add margin to the original dimensions
  const margin = 8; // Transparent margin size (adjust as needed)
  const {
    mode = 'default',
    width = 1000,
    height = 480,
    gradient: gradientOptions,
    track,
    progress: progressOptions,
  } = options;

  const innerWidth = width - margin * 2;
  const innerHeight = height - margin * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  const cornerRadius = 24;
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

  ctx.save();
  ctx.clip();

  const gradient = createGradient(
    ctx,
    innerWidth,
    innerHeight,
    gradientOptions
  );
  ctx.fillStyle = gradient;
  ctx.fillRect(margin, margin, innerWidth, innerHeight);

  GlobalFonts.registerFromPath(
    './assets/SpotifyMixUI-TitleVariable.ttf',
    'SpotifyMixUITitle'
  );

  if (mode === 'compact') {
    const artworkSize = innerHeight * 0.8;
    const x = margin + innerWidth * 0.05;
    const y = margin + (innerHeight - artworkSize) / 2;

    try {
      const artwork = await loadImage(track.artworkUrl);
      await drawArtwork(ctx, artwork, x, y, artworkSize);
    } catch (err) {
      throw new Error(
        `Failed to load artwork: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    const textX = x + artworkSize + innerWidth * 0.05;
    const textY = margin + innerHeight / 2;

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    ctx.font = '700 48px SpotifyMixUITitle';
    ctx.fillText(track.name, textX, textY - 20);

    ctx.font = '400 28px SpotifyMixUITitle';
    if (track.album) {
      const albumText = `${track.album} • `;
      const albumTextMetrics = ctx.measureText(albumText);
      const artistText = track.artists.join(', ');

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(albumText, textX, textY + 40);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(artistText, textX + albumTextMetrics.width, textY + 40);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(track.artists.join(', '), textX, textY + 40);
    }
  } else {
    try {
      const artwork = await loadImage(track.artworkUrl);
      const artworkSize = Math.min(innerWidth, innerHeight) * 0.6;
      const x = margin + (innerWidth - artworkSize) / 2;
      const y = margin + (innerHeight - artworkSize) / 2;
      await drawArtwork(ctx, artwork, x, y, artworkSize);
    } catch (err) {
      throw new Error(
        `Failed to load artwork: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    const textMargin = 48;
    const textX = margin + textMargin;
    const bottomMargin = 40;
    const titleY = margin + innerHeight - bottomMargin - 32;

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    ctx.font = '700 28px SpotifyMixUITitle';
    ctx.fillText(track.name, textX, titleY);

    ctx.font = '400 18px SpotifyMixUITitle';
    if (track.album) {
      const albumText = `${track.album} - `;
      const albumTextMetrics = ctx.measureText(albumText);
      const artistText = track.artists.join(', ');

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(albumText, textX, titleY + 28);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(artistText, textX + albumTextMetrics.width, titleY + 28);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(track.artists.join(', '), textX, titleY + 28);
    }
  }

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
