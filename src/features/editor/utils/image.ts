import { Image as RNImage } from 'react-native';
import type { EditorImage } from '../types/editor.types';

export class ImageLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageLoadError';
  }
}

// `image/jpg` / `image/pjpeg` are non-standard but iOS pickers emit them for
// JPEGs (the type is guessed from the `.jpg` extension), so treat them as jpeg.
const SUPPORTED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
];

/** True when we can reasonably expect the renderer to decode this asset. */
export function isSupportedMimeType(mime?: string): boolean {
  if (!mime) return true; // some pickers omit it; fall through to a load test
  return SUPPORTED_MIME.includes(mime.toLowerCase());
}

/**
 * Resolve the intrinsic pixel size of an image URI. Rejects (rather than
 * hanging) on a decode/network failure. This is the one place we read image
 * dimensions — callers pass the result around, they don't re-measure.
 */
export function measureImage(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => {
        if (!width || !height) {
          reject(new ImageLoadError('Image reported a zero dimension.'));
          return;
        }
        resolve({ width, height });
      },
      (error: unknown) =>
        reject(
          new ImageLoadError(
            error instanceof Error ? error.message : 'Could not load the image.',
          ),
        ),
    );
  });
}

/**
 * Validate a freshly picked asset and normalise it into an EditorImage.
 * Throws ImageLoadError with a user-presentable message on any problem.
 */
export async function toEditorImage(input: {
  uri?: string;
  width?: number;
  height?: number;
  type?: string;
  fileName?: string;
}): Promise<EditorImage> {
  if (!input.uri) {
    throw new ImageLoadError('No image was returned by the picker.');
  }
  if (!isSupportedMimeType(input.type)) {
    throw new ImageLoadError(`Unsupported image format${input.type ? ` (${input.type})` : ''}.`);
  }

  let width = input.width ?? 0;
  let height = input.height ?? 0;
  if (!width || !height) {
    const measured = await measureImage(input.uri);
    width = measured.width;
    height = measured.height;
  }

  return {
    uri: input.uri,
    width,
    height,
    mimeType: input.type,
    fileName: input.fileName,
  };
}
