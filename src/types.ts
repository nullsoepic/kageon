export type GradientDirection = {
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
};

export interface GradientOptions {
  type: 'radial' | 'linear';
  colors: string[];
  direction?: GradientDirection;
}

export interface SongPreviewOptions {
  mode?: 'default' | 'compact';
  gradient: GradientOptions;
  width?: number;
  height?: number;
  track: {
    artworkUrl: string;
    name: string;
    artists: string[];
    album?: string;
  };
  progress?: {
    showBar?: boolean;
    duration?: number;
    elapsed?: number;
    color?: string;
  };
}
