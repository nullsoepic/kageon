import { generatePreviewImage } from './src';
import { writeFileSync } from 'fs';

try {
  const image = await generatePreviewImage({
    mode: 'compact',
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
      album: 'HEAR ME OUT',
    },
    progress: {
      duration: 220,
      elapsed: 124,
      showBar: true,
    },
    width: 1000,
    height: 480,
  });

  writeFileSync('preview.png', image);
  console.log('Preview image saved to preview.png');
} catch (err) {
  console.error('Error generating preview:', err);
}
