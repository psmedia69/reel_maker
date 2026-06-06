/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { Film, Sparkles, Loader2, Play, Info, Heart, Layers, HelpCircle } from "lucide-react";
import { ReelConfig } from "./types";
import { AssetSelector } from "./components/AssetSelector";
import { ReelPreview } from "./components/ReelPreview";
import { ReelExporter } from "./components/ReelExporter";
import {
  DEFAULT_COOL_CAT_URL,
  DEFAULT_SURPRISED_CAT_URL,
  DEFAULT_SHOCKED_CAT_URL,
  DEFAULT_OUTRO_CAT_URL,
  generateDefaultVideoFile,
} from "./utils/assets";

export default function App() {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initStage, setInitStage] = useState<string>("Initializing workspace...");
  const [initProgress, setInitProgress] = useState<number>(10);

  const [config, setConfig] = useState<ReelConfig | null>(null);

  // Initialize workspace with instant high-quality procedural default assets
  const initializeWorkspace = async () => {
    try {
      setIsInitializing(true);
      setInitProgress(30);
      setInitStage("Initializing studio timeline metadata...");
      
      setInitProgress(70);
      setInitStage("Readying vector cartoon layers...");

      setInitProgress(100);
      setInitStage("Studio pre-loaded successfully!");

      setConfig({
        introVideo: {
          file: null,
          url: "", // Empty URL flags the canvas to draw the intro frame procedurally!
          name: "Default Intro (Procedural)",
          duration: 3.0,
        },
        mainVideo: {
          file: null,
          url: "", // Empty URL flags procedural placeholder drawing!
          name: "Default Sample Main (Procedural)",
          duration: 6.0,
        },
        outroVideo: {
          file: null,
          url: "", // Empty URL flags procedural outro drawing!
          name: "Default Outro (Procedural)",
          duration: 2.0,
        },
        reaction1: {
          file: null,
          url: DEFAULT_SURPRISED_CAT_URL,
          name: "Default Surprise (2.png)",
        },
        reaction2: {
          file: null,
          url: DEFAULT_SHOCKED_CAT_URL,
          name: "Default Shock (3.png)",
        },
        tiltAngle: -6, // exact stylish rotation like 0.mp4
        flowerCount: 35, // pink cherry blossoms count
        flowerSpeed: 10, // speed multiple
        transitionDuration: 1.2, // standard wipe length
        audioMixVolume: 0.8,
        instagramId: "",
      });
      
      setTimeout(() => {
        setIsInitializing(false);
      }, 100);
    } catch (e) {
      console.error("Failed to initialize workspace:", e);
      setInitStage("Asset synthesis fallback active. Starting studio...");
      // fallback structural template
      setConfig({
        introVideo: { file: null, url: "", name: "No file selected", duration: 3.0 },
        mainVideo: { file: null, url: "", name: "No file selected", duration: 6.0 },
        outroVideo: { file: null, url: "", name: "No file selected", duration: 2.0 },
        reaction1: { file: null, url: DEFAULT_SURPRISED_CAT_URL, name: "Surprise Cat (2.png)" },
        reaction2: { file: null, url: DEFAULT_SHOCKED_CAT_URL, name: "Shocked Cat (3.png)" },
        tiltAngle: -6,
        flowerCount: 35,
        flowerSpeed: 10,
        transitionDuration: 1.2,
        audioMixVolume: 0.8,
        instagramId: "",
      });
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeWorkspace();
  }, []);

  const handleUpdateConfig = (updated: Partial<ReelConfig>) => {
    if (!config) return;
    setConfig((prev) => (prev ? { ...prev, ...updated } : null));
  };

  if (isInitializing || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 h-md rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center border border-pink-500/30 animate-pulse">
              <Film size={26} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Reel Maker Studio</h2>
            <p className="text-xs text-slate-400">Loading workspace files & pre-rendering vector cartoon default loops...</p>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 h-full transition-all duration-300"
                style={{ width: `${initProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-pink-400 font-mono tracking-wider">&gt; {initStage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-slate-900 font-sans antialiased">
      {/* 1. HEADER HERO PANEL */}
      <header className="bg-white border-b border-slate-200 py-4.5 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-xs shrink-0">
              <Film size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
                Reel Maker Studio
                <span className="text-[10px] bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded font-mono font-medium">BETA</span>
              </h1>
              <span className="text-xs text-slate-400 leading-normal block mt-1">
                Design custom timeline videos with dynamic wipe transitions, tilted templates, and cute reaction decals.
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. CORE WORKSPACE BOARD */}
      <main className="max-w-7xl mx-auto px-6 py-8" id="studio-core-workspace">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* LEFT PANEL: CONFIG & RESOURCE MANAGER (cols: 5) */}
          <section className="xl:col-span-5 space-y-6" id="assets-management-deck">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers size={15} className="text-slate-500" />
                Asset Timeline Pipeline
              </h2>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Add your recordings or pictures below. We pre-render standard vector cat clips and action shots so you can run test exports inside the player right away.
              </p>

              <AssetSelector
                config={config}
                onUpdateConfig={handleUpdateConfig}
                isGeneratingDefaults={isInitializing}
                onRegenerateDefaults={initializeWorkspace}
              />
            </div>
          </section>

          {/* RIGHT PANEL: PLAYER PREVIEW SCREEN & RECORDER CHASSIS (cols: 7) */}
          <section className="xl:col-span-7 space-y-6" id="player-rendering-station">
            {/* Live Playback View */}
            <ReelPreview
              config={config}
              onUpdateConfig={handleUpdateConfig}
              isGeneratingDefaults={isInitializing}
            />

            {/* Offline compiler block */}
            <ReelExporter config={config} />
          </section>
        </div>

        {/* 3. TIPS & WORKFLOW EXPLANATION SECTION (FOOTNOTE) */}
        <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HelpCircle size={15} />
            <span>Need help? Upload any camera footage up to 60 seconds. Everything executes in real-time.</span>
          </div>
          <div>
            <span>Powered by HTML5 Canvas &amp; MediaRecorder API</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
