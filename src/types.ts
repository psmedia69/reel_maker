export interface VideoAsset {
  file: File | null;
  url: string; // Blob URL or default placeholder Data URL/Source URL
  name: string;
  duration?: number; // Detected duration in seconds
}

export interface ImageAsset {
  file: File | null;
  url: string; // Blob URL or data URL
  name: string;
}

export interface ReelConfig {
  introVideo: VideoAsset;
  mainVideo: VideoAsset;
  outroVideo: VideoAsset;
  reaction1: ImageAsset;
  reaction2: ImageAsset;
  tiltAngle: number; // degrees of rotation for RHS footage
  flowerCount: number; // number of pinkish falling flowers
  flowerSpeed: number; // pixels per frame or factor
  transitionDuration: number; // seconds for wipe / crossfade
  audioMixVolume: number; // volume multiplier 0-1
  instagramId?: string; // Optional Instagram ID for footage girl
}
