# kageon

A TypeScript library for generating Spotify-like song preview images using canvas on the server.

![Preview Image](preview.png)

## Installation

```bash
bun add kageon
```

## Usage

```typescript
import { generatePreviewImage } from 'kageon';

const image = await generatePreviewImage({
  gradient: {
    colors: ['#202840', '#26304F'],
    direction: {
      start: 'bottomleft',
      end: 'topright',
    },
    type: 'linear',
  },
  track: {
    artworkUrl:
      'https://i.scdn.co/image/ab67616d0000b2735fcc88b1baa5ba0d2ce49de7',
    name: 'HEAR ME OUT',
    artists: ['AmaLee'],
  },
  progress: {
    duration: 220,
    elapsed: 124,
    showBar: true,
  },
  width: 1920,
  height: 973,
});

// image is a Buffer containing PNG data
```

## API

### `generatePreviewImage(options: SongPreviewOptions): Promise<Buffer>`

Generates a song preview image with the given options.

#### Options

```typescript
interface GradientDirection {
  start:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'topleft'
    | 'topright'
    | 'bottomleft'
    | 'bottomright';
  end:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'topleft'
    | 'topright'
    | 'bottomleft'
    | 'bottomright';
}

interface GradientOptions {
  type: 'radial' | 'linear';
  colors: string[];
  direction?: GradientDirection; // Required for linear gradients
}

interface SongPreviewOptions {
  gradient: GradientOptions;
  width?: number; // default 1920
  height?: number; // default 1080
  track: {
    artworkUrl: string;
    name: string;
    artists: string[];
  };
  progress?: {
    showBar?: boolean;
    duration?: number; // in seconds
    elapsed?: number; // in seconds
    color?: string;
  };
}
```
