import React, { useRef, useState } from "react";
import { Upload, Video, Image as ImageIcon, Heart, Info, X, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { ReelConfig, VideoAsset, ImageAsset } from "../types";

interface AssetSelectorProps {
  config: ReelConfig;
  onUpdateConfig: (updated: Partial<ReelConfig>) => void;
  isGeneratingDefaults: boolean;
  onRegenerateDefaults: () => void;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  config,
  onUpdateConfig,
  isGeneratingDefaults,
  onRegenerateDefaults,
}) => {
  const [videoError, setVideoError] = useState<string | null>(null);
  
  // File refs
  const introInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const outroInputRef = useRef<HTMLInputElement>(null);
  const reaction1InputRef = useRef<HTMLInputElement>(null);
  const reaction2InputRef = useRef<HTMLInputElement>(null);

  // Help detect video duration using a temporary video element
  const detectVideoDuration = (file: File, callback: (duration: number) => void) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      callback(video.duration);
    };
    video.onerror = () => {
      setVideoError("Failed to parse video metadata.");
    };
    video.src = URL.createObjectURL(file);
  };

  const handleVideoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "introVideo" | "mainVideo" | "outroVideo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError(null);

    // If it is the main video, validate duration is < 60 seconds
    if (type === "mainVideo") {
      getDurationAndValidate(file);
    } else {
      detectVideoDuration(file, (duration) => {
        const url = URL.createObjectURL(file);
        onUpdateConfig({
          [type]: {
            file,
            url,
            name: file.name,
            duration,
          },
        });
      });
    }
  };

  const getDurationAndValidate = (file: File) => {
    detectVideoDuration(file, (duration) => {
      if (duration > 60.5) {
        setVideoError(`Main footage must be less than 60 seconds. Selected video is ${Math.round(duration)}s long.`);
        return;
      }
      const url = URL.createObjectURL(file);
      onUpdateConfig({
        mainVideo: {
          file,
          url,
          name: file.name,
          duration,
        },
      });
    });
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "reaction1" | "reaction2"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onUpdateConfig({
      [type]: {
        file,
        url,
        name: file.name,
      },
    });
  };

  // Helper to handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drop for Main Video
  const handleMainDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoError(null);
      getDurationAndValidate(file);
    } else {
      setVideoError("Please drop a valid MP4/WebM video file.");
    }
  };

  return (
    <div className="space-y-6" id="asset-selector-container">
      {/* Defaults Notice containing state trigger */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-emerald-900">Pre-loaded Assets Active</h4>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Beautiful Default Cartoon Cat vectors (Cool, Surprised, Shocked, Happy) and recorded videos are initialized! You can hit play immediately, modify settings, or upload your own files below.
          </p>
          <button
            onClick={onRegenerateDefaults}
            disabled={isGeneratingDefaults}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-300 transition-colors shadow-2xs"
          >
            <RefreshCw size={12} className={isGeneratingDefaults ? "animate-spin" : ""} />
            {isGeneratingDefaults ? "Resetting defaults..." : "Reset Defaults"}
          </button>
        </div>
      </div>

      {/* CORE INPUT: Main Footage upload */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Required &lt; 60s
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Video className="text-pink-500" size={18} />
          Step 1: Upload Main Footage
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          This is the central tilted footage on the right-hand side. Reaction cat 1 and 2 will overlay based on its total duration.
        </p>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleMainDrop}
          onClick={() => mainInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            config.mainVideo.file
              ? "border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70"
              : "border-slate-300 hover:border-pink-400 bg-slate-50 hover:bg-slate-50/80"
          }`}
        >
          <input
            type="file"
            ref={mainInputRef}
            className="hidden"
            accept="video/*"
            onChange={(e) => handleVideoUpload(e, "mainVideo")}
          />

          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-3">
              <Upload size={22} className="animate-pulse" />
            </div>
            
            {config.mainVideo.file ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Selected: {config.mainVideo.name}
                </p>
                <p className="text-xs text-emerald-600 font-medium">
                  Duration: {config.mainVideo.duration?.toFixed(1) || "Analyzing..."}s | Ready for placement
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">
                  Drag &amp; drop main video here, or <span className="text-pink-600 hover:underline">browse</span>
                </p>
                <p className="text-xs text-slate-400">
                  Supports MP4, WebM, MOV up to 60 seconds
                </p>
              </div>
            )}
          </div>
        </div>

        {videoError && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{videoError}</span>
          </div>
        )}

        {/* Instagram ID section below footage upload */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-250">
          <label htmlFor="insta-id-input" className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="text-pink-600 font-extrabold text-lg">@</span> Creator's Instagram ID
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <span className="text-[13px] font-semibold text-slate-400">instagram.com/</span>
            </div>
            <input
              type="text"
              id="insta-id-input"
              value={config.instagramId || ""}
              onChange={(e) => {
                let val = e.target.value.trim();
                if (val.startsWith("@")) val = val.substring(1);
                onUpdateConfig({ instagramId: val });
              }}
              placeholder="username (e.g. jenny_sweet)"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-[128px] pr-4 text-sm placeholder-slate-400 focus:border-pink-500 focus:bg-white focus:outline-hidden transition-all duration-150 font-mono text-slate-800 font-semibold shadow-inner"
            />
          </div>
          <p className="text-xs text-slate-500 leading-normal">
            Will display as <span className="font-mono text-pink-600 font-bold bg-pink-50 px-1.5 py-0.5 rounded text-[11px]">@{config.instagramId || "username"}</span> above the footage, swinging in pendulum sync.
          </p>
        </div>
      </div>

      {/* ADDITIONAL ASSETS: Cat Clips & Reaction Overlays */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Heart className="text-rose-500" size={18} />
            Step 2: Customize Video Clips &amp; Reactions
          </h3>
          <span className="text-xs text-slate-400">Optional: overrides defaults</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reaction 1 Overlay (2.png) */}
          <div className="border border-slate-100 rounded-lg p-3.5 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-violet-500" />
                Reaction 1 (2.png)
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                L / 2 First Half
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={config.reaction1.url}
                  alt="Reaction 1"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 overflow-hidden flex-1">
                <span className="text-xs block text-slate-700 truncate font-medium">
                  {config.reaction1.name}
                </span>
                <button
                  type="button"
                  onClick={() => reaction1InputRef.current?.click()}
                  className="text-[11px] text-pink-600 hover:text-pink-700 font-medium"
                >
                  Change PNG
                </button>
              </div>
            </div>
            <input
              type="file"
              ref={reaction1InputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "reaction1")}
            />
          </div>

          {/* Reaction 2 Overlay (3.png) */}
          <div className="border border-slate-100 rounded-lg p-3.5 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-teal-500" />
                Reaction 2 (3.png)
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                L / 2 Second Half
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={config.reaction2.url}
                  alt="Reaction 2"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 overflow-hidden flex-1">
                <span className="text-xs block text-slate-700 truncate font-medium">
                  {config.reaction2.name}
                </span>
                <button
                  type="button"
                  onClick={() => reaction2InputRef.current?.click()}
                  className="text-[11px] text-pink-600 hover:text-pink-700 font-medium"
                >
                  Change PNG
                </button>
              </div>
            </div>
            <input
              type="file"
              ref={reaction2InputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "reaction2")}
            />
          </div>

          {/* Intro Video / Voice Track (1.mp4) */}
          <div className="border border-slate-100 rounded-lg p-3.5 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Video size={14} className="text-sky-500" />
                Intro Voice / Clip (1.mp4)
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                Cat's Voice
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs block text-slate-700 truncate font-medium">
                {config.introVideo.name}
              </span>
              <button
                type="button"
                onClick={() => introInputRef.current?.click()}
                className="text-[11px] text-pink-600 hover:text-pink-700 font-medium"
              >
                Change MP4 / Audio Voice
              </button>
            </div>
            <input
              type="file"
              ref={introInputRef}
              className="hidden"
              accept="video/*,audio/*"
              onChange={(e) => handleVideoUpload(e, "introVideo")}
            />
          </div>

          {/* Outro Video (2.mp4) */}
          <div className="border border-slate-100 rounded-lg p-3.5 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Video size={14} className="text-indigo-500" />
                Outro Clip (2.mp4)
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                Runs Last
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs block text-slate-700 truncate font-medium">
                {config.outroVideo.name}
              </span>
              <button
                type="button"
                onClick={() => outroInputRef.current?.click()}
                className="text-[11px] text-pink-600 hover:text-pink-700 font-medium"
              >
                Change MP4
              </button>
            </div>
            <input
              type="file"
              ref={outroInputRef}
              className="hidden"
              accept="video/*"
              onChange={(e) => handleVideoUpload(e, "outroVideo")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
