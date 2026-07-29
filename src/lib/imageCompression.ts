import { STORABLE_IMAGE_TYPES } from "./storage/avatarPaths";

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  /** Byte size of the file the user picked. */
  originalSize: number;
  /** Byte size after compression. */
  size: number;
  type: string;
}

export interface CompressOptions {
  /** Longest edge of the output, in pixels. */
  maxDimension?: number;
  /** Encoder quality, 0-1. Ignored by lossless formats. */
  quality?: number;
}

/** Avatars are displayed at 56px at most, so 512px covers retina and cropping. */
export const AVATAR_MAX_DIMENSION = 512;
export const AVATAR_QUALITY = 0.82;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Storage rules reject anything at or above 5 MB, so never pass one through. */
export const MAX_STORED_BYTES = 5 * 1024 * 1024;

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Returns an error message when the file cannot be used, otherwise null. */
export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) {
    return "Choose an image file (PNG, JPG, WebP or GIF).";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That image is ${formatBytes(file.size)}. Choose one under ${formatBytes(
      MAX_UPLOAD_BYTES,
    )}.`;
  }
  return null;
};

/**
 * Scales dimensions so the longest edge fits `maxDimension`, preserving the
 * aspect ratio. Smaller images are left alone rather than upscaled.
 */
export const computeTargetSize = (
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } => {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };

  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxDimension / longestEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

const loadImage = async (file: File): Promise<LoadedImage> => {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const element = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("That image could not be read."));
      image.src = url;
    });

    return {
      source: element,
      width: element.naturalWidth,
      height: element.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** WebP encoding is broadly supported; JPEG is the fallback for older engines. */
const pickOutputType = (canvas: HTMLCanvasElement): string =>
  canvas.toDataURL("image/webp").startsWith("data:image/webp") ? "image/webp" : "image/jpeg";

/**
 * Downscales and re-encodes an image in the browser so only a small file is
 * ever sent to storage. Falls back to the original when compression would not
 * actually save anything (e.g. an already-tiny icon).
 */
export const compressImage = async (
  file: File,
  options: CompressOptions = {},
): Promise<CompressedImage> => {
  const { maxDimension = AVATAR_MAX_DIMENSION, quality = AVATAR_QUALITY } = options;
  const image = await loadImage(file);

  try {
    const target = computeTargetSize(image.width, image.height, maxDimension);
    if (target.width === 0 || target.height === 0) {
      throw new Error("That image appears to be empty.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");

    context.drawImage(image.source, 0, 0, target.width, target.height);

    const outputType = pickOutputType(canvas);
    const blob = await canvasToBlob(canvas, outputType, quality);

    if (!blob) throw new Error("That image could not be processed.");

    // Re-encoding can inflate small or already-optimised files. Only formats
    // storage accepts may pass through untouched; a GIF or AVIF is always
    // re-encoded so the uploaded extension stays within the allowed set.
    const passthroughAllowed = (STORABLE_IMAGE_TYPES as readonly string[]).includes(file.type);

    if (
      passthroughAllowed &&
      file.size < MAX_STORED_BYTES &&
      blob.size >= file.size &&
      target.width === image.width
    ) {
      return {
        blob: file,
        width: image.width,
        height: image.height,
        originalSize: file.size,
        size: file.size,
        type: file.type,
      };
    }

    return {
      blob,
      width: target.width,
      height: target.height,
      originalSize: file.size,
      size: blob.size,
      type: outputType,
    };
  } finally {
    image.release();
  }
};
