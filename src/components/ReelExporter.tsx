import React, { useState, useRef } from "react";
import { Download, Film, Sparkles, Loader2, Play, CheckCircle, RefreshCcw, HelpCircle } from "lucide-react";
import { ReelConfig } from "../types";
import { DEFAULT_COOL_CAT_URL, DEFAULT_OUTRO_CAT_URL, DEFAULT_SURPRISED_CAT_URL, svgToDataUrl } from "../utils/assets";

interface ReelExporterProps {
  config: ReelConfig;
}

interface ExportStatus {
  step: "idle" | "loading" | "rendering" | "completed" | "failed";
  progress: number;
  message: string;
}

export const ReelExporter: React.FC<ReelExporterProps> = ({ config }) => {
  const [selectedFormat, setSelectedFormat] = useState<"mp4" | "webm">("mp4");
  const [exportedFilename, setExportedFilename] = useState<string>("compiled_reaction_reel.mp4");
  const [status, setStatus] = useState<ExportStatus>({
    step: "idle",
    progress: 0,
    message: "",
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // Ref to cancel current export if necessary
  const cancelExportRef = useRef<boolean>(false);

  const startExport = async () => {
    let cleanupDOMAndBlobUrls: (() => void) | null = null;
    try {
      setStatus({ step: "loading", progress: 0, message: "Initializing export context..." });
      setDownloadUrl(null);
      cancelExportRef.current = false;

      // A. Create/activate AudioContext synchronously inside user touch/click gesture stack
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      // 1. Create offline compilation canvas matching 1080x1920 (Full HD for Premium Reels)
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Could not initialize 2D context.");

      // Logical drawing coordinate space match virtual 540x960
      const vWidth = 540;
      const vHeight = 960;
      const exportScale = 1080 / 540; // 2.0x scaling factor (Full HD)

      const introName = config.introVideo.name || "";
      const isIntroAudio = introName.endsWith(".mp3") || introName.endsWith(".wav") || introName.endsWith(".m4a") || introName.endsWith(".ogg") || (introName.endsWith(".webm") && !config.introVideo.url.includes("video"));

      // 2. Create the native unmuted video elements and prime them synchronously under user gesture!
      const introAudioEl = isIntroAudio ? document.createElement("audio") : null;
      const introVideoEl = isIntroAudio ? null : document.createElement("video");
      const mainVideoEl = document.createElement("video");
      const outroVideoEl = document.createElement("video");

      const activeIntroEl = (isIntroAudio ? introAudioEl! : introVideoEl!) as HTMLMediaElement;

      activeIntroEl.muted = false;
      mainVideoEl.muted = false;
      outroVideoEl.muted = false;

      activeIntroEl.volume = 1.0;
      mainVideoEl.volume = 1.0;
      outroVideoEl.volume = 1.0;

      if (introVideoEl) introVideoEl.playsInline = true;
      mainVideoEl.playsInline = true;
      outroVideoEl.playsInline = true;

      try {
        // Feed direct URLs first for hardware unblock priming if loaded
        if (config.introVideo.url) activeIntroEl.src = config.introVideo.url;
        if (config.mainVideo.url) mainVideoEl.src = config.mainVideo.url;
        if (config.outroVideo.url) outroVideoEl.src = config.outroVideo.url;

        if (config.introVideo.url) activeIntroEl.play().catch(() => {});
        if (config.mainVideo.url) mainVideoEl.play().catch(() => {});
        if (config.outroVideo.url) outroVideoEl.play().catch(() => {});

        activeIntroEl.pause();
        mainVideoEl.pause();
        outroVideoEl.pause();
      } catch (e) {
        console.warn("Synchronous unmuted user gesture activation warning:", e);
      }

      // Pre-load standard image assets to avoid load asynchronous skips during rendering
      const loadImg = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          if (url.startsWith("http") || url.startsWith("https")) {
            img.crossOrigin = "anonymous";
          }
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load asset: ${url}`));
          img.src = url;
        });
      };

      const fetchAsBlobUrl = async (url: string): Promise<string> => {
        if (!url) return "";
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        } catch (e) {
          console.warn("Failed to fetch as blob, using direct URL:", url, e);
          return url;
        }
      };

      // Appending to the body helps Safari, Chrome, and iOS unblock playing of videos unmuted and stream audio to Web Audio API
      // To prevent browsers from throttling/suspending hidden offscreen videos, we keep them inside a micro active visible container.
      const styleHiddenMedia = (elem: HTMLVideoElement | HTMLAudioElement) => {
        let container = document.getElementById("hidden-video-emitter-container");
        if (!container) {
          container = document.createElement("div");
          container.id = "hidden-video-emitter-container";
          container.style.position = "fixed";
          container.style.bottom = "1px";
          container.style.right = "1px";
          container.style.width = "4px";
          container.style.height = "4px";
          container.style.overflow = "hidden";
          container.style.opacity = "0.05";
          container.style.pointerEvents = "none";
          container.style.zIndex = "-1000";
          document.body.appendChild(container);
        }
        elem.style.width = "160px";
        elem.style.height = "90px";
        elem.style.display = "block";
        elem.style.opacity = "1.0";
        container.appendChild(elem);
      };

      styleHiddenMedia(activeIntroEl);
      styleHiddenMedia(mainVideoEl);
      styleHiddenMedia(outroVideoEl);

      const loadMedia = (elem: HTMLVideoElement | HTMLAudioElement, url: string): Promise<HTMLVideoElement | HTMLAudioElement> => {
        return new Promise((resolve) => {
          if (!url) {
            resolve(elem);
            return;
          }
          elem.src = url;
          elem.crossOrigin = "anonymous";
          elem.muted = false; // Must be false to hook into Web Audio API correctly
          elem.volume = 1.0;
          if (elem instanceof HTMLVideoElement) {
            elem.playsInline = true;
          }
          elem.onloadeddata = () => resolve(elem);
          elem.onerror = () => {
            resolve(elem);
          };
          elem.load();
        });
      };

      setStatus({ step: "loading", progress: 5, message: "Pre-fetching video files..." });
      const [blobIntroUrl, blobMainUrl, blobOutroUrl] = await Promise.all([
        config.introVideo.url ? fetchAsBlobUrl(config.introVideo.url) : Promise.resolve(""),
        config.mainVideo.url ? fetchAsBlobUrl(config.mainVideo.url) : Promise.resolve(""),
        config.outroVideo.url ? fetchAsBlobUrl(config.outroVideo.url) : Promise.resolve(""),
      ]);

      cleanupDOMAndBlobUrls = () => {
        try {
          if (activeIntroEl.parentNode) activeIntroEl.parentNode.removeChild(activeIntroEl);
          if (mainVideoEl.parentNode) mainVideoEl.parentNode.removeChild(mainVideoEl);
          if (outroVideoEl.parentNode) outroVideoEl.parentNode.removeChild(outroVideoEl);
        } catch (e) {
          console.warn("Failed to remove temporary video child:", e);
        }
        try {
          if (blobIntroUrl) URL.revokeObjectURL(blobIntroUrl);
          if (blobMainUrl) URL.revokeObjectURL(blobMainUrl);
          if (blobOutroUrl) URL.revokeObjectURL(blobOutroUrl);
        } catch(e) {}
      };

      setStatus({ step: "loading", progress: 12, message: "Loading clip resources..." });
      
      const [reaction1, reaction2, catIntroImg, catOutroImg, catMainImg] = await Promise.all([
        loadImg(config.reaction1.url),
        loadImg(config.reaction2.url),
        loadImg(DEFAULT_COOL_CAT_URL),
        loadImg(DEFAULT_OUTRO_CAT_URL),
        loadImg(DEFAULT_SURPRISED_CAT_URL),
        blobIntroUrl ? loadMedia(activeIntroEl, blobIntroUrl) : Promise.resolve(activeIntroEl),
        blobMainUrl ? loadMedia(mainVideoEl, blobMainUrl) : Promise.resolve(mainVideoEl),
        blobOutroUrl ? loadMedia(outroVideoEl, blobOutroUrl) : Promise.resolve(outroVideoEl),
      ]);

      // Initialize Falling Flowers array
      const flowerParams = [];
      for (let i = 0; i < config.flowerCount; i++) {
        flowerParams.push({
          x: Math.random() * vWidth,
          y: Math.random() * -1200, // staggered start
          size: 10 + Math.random() * 15,
          speedY: (1.5 + Math.random() * 2) * (config.flowerSpeed / 10),
          speedX: (-0.6 + Math.random() * 1.2) * (config.flowerSpeed / 10),
          rot: Math.random() * Math.PI * 2,
          rotSpeed: -0.02 + Math.random() * 0.04,
        });
      }

      // Initialize Cute Falling Heart particles array
      const heartParams: Array<{
        x: number;
        y: number;
        size: number;
        speedY: number;
        speedX: number;
        rot: number;
        rotSpeed: number;
        color: string;
      }> = [];
      const heartColors = ["#fb7185", "#f43f5e", "#e11d48", "#ff4d6d", "#ff758f", "#ef4444"];
      for (let i = 0; i < config.flowerCount; i++) {
        heartParams.push({
          x: Math.random() * vWidth,
          y: Math.random() * -1200,
          size: 6 + Math.random() * 8, // small romantic sizes
          speedY: (1.2 + Math.random() * 1.8) * (config.flowerSpeed / 10),
          speedX: (-0.5 + Math.random() * 1.0) * (config.flowerSpeed / 10),
          rot: Math.random() * Math.PI * 2,
          rotSpeed: -0.03 + Math.random() * 0.06,
          color: heartColors[Math.floor(Math.random() * heartColors.length)],
        });
      }

      // Initialize Web Audio API destination and gain mix structures
      const dest = audioCtx.createMediaStreamDestination();

      const gainIntro = audioCtx.createGain();
      const gainMain = audioCtx.createGain();
      const gainOutro = audioCtx.createGain();

      gainIntro.gain.value = config.audioMixVolume;
      gainMain.gain.value = config.audioMixVolume;
      gainOutro.gain.value = config.audioMixVolume;

      const introAudioSource = audioCtx.createMediaElementSource(activeIntroEl);
      const mainAudioSource = audioCtx.createMediaElementSource(mainVideoEl);
      const outroAudioSource = audioCtx.createMediaElementSource(outroVideoEl);

      introAudioSource.connect(gainIntro);
      mainAudioSource.connect(gainMain);
      outroAudioSource.connect(gainOutro);

      gainIntro.connect(dest);
      gainMain.connect(dest);
      gainOutro.connect(dest);

      gainIntro.connect(audioCtx.destination);
      gainMain.connect(audioCtx.destination);
      gainOutro.connect(audioCtx.destination);

      await audioCtx.resume();

      // Configure media stream recording
      const canvasStream = canvas.captureStream(30); // 30 FPS
      const combinedStream = new MediaStream();
      combinedStream.addTrack(canvasStream.getVideoTracks()[0]);
      
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        combinedStream.addTrack(audioTrack);
      }

      let mimeType = "";
      let fileExtension = "webm";

      if (selectedFormat === "mp4") {
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264,aac")) {
          mimeType = "video/mp4;codecs=h264,aac";
          fileExtension = "mp4";
        } else if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264,mp3")) {
          mimeType = "video/mp4;codecs=h264,mp3";
          fileExtension = "mp4";
        } else if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1,mp4a.40.2")) {
          mimeType = "video/mp4;codecs=avc1,mp4a.40.2";
          fileExtension = "mp4";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
          fileExtension = "mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")) {
          mimeType = "video/webm;codecs=h264,opus";
          fileExtension = "webm";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          mimeType = "video/webm;codecs=vp9,opus";
          fileExtension = "webm";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
          mimeType = "video/webm;codecs=vp8,opus";
          fileExtension = "webm";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
          fileExtension = "webm";
        }
      } else {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          mimeType = "video/webm;codecs=vp9,opus";
          fileExtension = "webm";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
          mimeType = "video/webm;codecs=vp8,opus";
          fileExtension = "webm";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")) {
          mimeType = "video/webm;codecs=h264,opus";
          fileExtension = "webm";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
          fileExtension = "webm";
        }
      }

      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }
      // High-quality bitrate for 1080x1920 Full HD format (6 Mbps - professionally optimized for quality and performance)
      recorderOptions.videoBitsPerSecond = 6000000;

      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordedPromise = new Promise<{ objectUrl: string; actualExt: string }>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blobType = mimeType.toLowerCase().includes("video/mp4") ? "video/mp4" : "video/webm";
          const finalBlob = new Blob(chunks, { type: blobType });
          const objectUrl = URL.createObjectURL(finalBlob);
          resolve({ objectUrl, actualExt: fileExtension });
        };
        mediaRecorder.onerror = (err) => reject(err);
      });

      // Begin recording
      mediaRecorder.start();
      setStatus({ step: "rendering", progress: 20, message: "Starting virtual recording timeline..." });

      // Determine durations
      const INTRO_DURATION = config.introVideo.duration || 3.0;
      const TRANSITION_DURATION = config.transitionDuration || 1.2;
      const mainDuration = config.mainVideo.duration || 8.0;
      const OUTRO_DURATION = config.outroVideo.duration || 2.0;
      const totalDuration = INTRO_DURATION + mainDuration + OUTRO_DURATION;

      let lastFrameTime = performance.now();
      let lastSecondValue = -1;
      let currentPlayhead = 0;
      let isRecording = true;

      const runExportLoop = async () => {
        if (cancelExportRef.current || !isRecording) {
          if (cancelExportRef.current) {
            try {
              mediaRecorder.stop();
              audioCtx.close();
            } catch (e) {}
            if (cleanupDOMAndBlobUrls) cleanupDOMAndBlobUrls();
            setStatus({ step: "idle", progress: 0, message: "" });
          }
          return;
        }

        // 1. Advance Playhead - High-precision fixed-step advancement for encoding stability
        const now = performance.now();
        let delta = (now - lastFrameTime) / 1000;
        
        // Cap delta to roughly 30fps (0.033) if the refresh rate is higher or lower
        // This ensures the virtual timeline stays perfectly indexed to the recorder's 30fps expectation
        if (delta > 0.04) delta = 0.033;
        if (delta < 0.01) delta = 0.016; // Minimum step to avoid zero-delta freezes
        
        lastFrameTime = now;
        currentPlayhead += delta;

        // End rendering when recording limit is reached
        if (currentPlayhead >= totalDuration) {
          isRecording = false;
          mediaRecorder.stop();
          setStatus({ step: "rendering", progress: 95, message: "Finalizing video file formatting..." });
          
          if (config.introVideo.url) { try { activeIntroEl.pause(); } catch(e) {} }
          if (config.mainVideo.url) { try { mainVideoEl.pause(); } catch(e) {} }
          if (config.outroVideo.url) { try { outroVideoEl.pause(); } catch(e) {} }

          const { objectUrl, actualExt } = await recordedPromise;
          if (cleanupDOMAndBlobUrls) cleanupDOMAndBlobUrls();
          try { audioCtx.close(); } catch(e) {}

          setDownloadUrl(objectUrl);
          setExportedFilename(`compiled_reaction_reel.${actualExt}`);
          setStatus({
            step: "completed",
            progress: 100,
            message: "Reel exported successfully with smooth dynamic stabilization!",
          });
          return;
        }

        // Update progress UI
        const progressPercentage = Math.round(20 + (Math.min(totalDuration, currentPlayhead) / totalDuration) * 75);
        if (Math.floor(currentPlayhead) !== lastSecondValue) {
          lastSecondValue = Math.floor(currentPlayhead);
          setStatus({
            step: "rendering",
            progress: progressPercentage,
            message: `Encoding... (${lastSecondValue}s / ${Math.round(totalDuration)}s)`,
          });
        }

        // Determine current phase
        let currentPhase: "intro" | "wipe" | "main" | "outro" = "intro";
        const CROSSFADE_DURATION = 0.5;
        const mainEndTime = INTRO_DURATION + mainDuration;
        const inCrossfadeToOutro = currentPlayhead >= mainEndTime - CROSSFADE_DURATION && currentPlayhead < mainEndTime;

        if (currentPlayhead < INTRO_DURATION) {
          currentPhase = "intro";
        } else if (currentPlayhead < INTRO_DURATION + mainDuration) {
          const mTime = currentPlayhead - INTRO_DURATION;
          if (mTime < TRANSITION_DURATION) {
            currentPhase = "wipe";
          } else {
            currentPhase = "main";
          }
        } else {
          currentPhase = "outro";
        }

        let phaseTime = 0;
        if (currentPhase === "intro") {
          phaseTime = currentPlayhead;
        } else if (currentPhase === "wipe" || currentPhase === "main") {
          phaseTime = currentPlayhead - INTRO_DURATION;
        } else {
          phaseTime = Math.min(OUTRO_DURATION, currentPlayhead - (INTRO_DURATION + mainDuration));
        }

        // 2. Synchronize media elements roughly with high-precision audio cross-fading
        if (currentPhase === "intro") {
          if (config.introVideo.url && activeIntroEl.paused) activeIntroEl.play().catch(() => {});
          gainIntro.gain.value = config.audioMixVolume;
          gainMain.gain.value = 0;
          gainOutro.gain.value = 0;
        } else if (currentPhase === "wipe" || currentPhase === "main") {
          if (config.mainVideo.url && mainVideoEl.paused) mainVideoEl.play().catch(() => {});
          
          if (inCrossfadeToOutro) {
            const p = (currentPlayhead - (mainEndTime - CROSSFADE_DURATION)) / CROSSFADE_DURATION;
            gainMain.gain.value = config.audioMixVolume * (1 - p);
            gainOutro.gain.value = config.audioMixVolume * p;
            if (config.outroVideo.url && outroVideoEl.paused) {
              outroVideoEl.play().catch(() => {});
              outroVideoEl.currentTime = currentPlayhead - mainEndTime + CROSSFADE_DURATION;
            }
          } else {
            gainIntro.gain.value = 0;
            gainMain.gain.value = config.audioMixVolume;
            gainOutro.gain.value = 0;
          }
        } else if (currentPhase === "outro") {
          if (config.outroVideo.url && outroVideoEl.paused) outroVideoEl.play().catch(() => {});
          gainIntro.gain.value = 0;
          gainMain.gain.value = 0;
          gainOutro.gain.value = config.audioMixVolume;
        }

        // 3. DRAWING PHASE - Optimized direct to canvas
        ctx.save();
        ctx.scale(exportScale, exportScale);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "medium";

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, vWidth, vHeight);

        // Procedural Drawing Helpers
        const drawProceduralIntro = (c: CanvasRenderingContext2D, timeSec: number, width: number, height: number) => {
          c.fillStyle = "#82a1bc"; 
          c.fillRect(0, 0, width, height);
          c.fillStyle = "#FFFFFF";
          c.textAlign = "center";
          c.textBaseline = "middle";
          const activeText = timeSec < 2.2 ? "Aaj ki princess kaun hai ?" : "";
          if (activeText) {
            c.save();
            c.fillStyle = "#FFFFFF";
            c.strokeStyle = "#0F172A";
            c.lineWidth = 5;
            c.beginPath();
            c.ellipse(width / 2, 160, 190, 55, 0, 0, Math.PI * 2);
            c.fill();
            c.stroke();
            c.fillStyle = "#0F172A";
            c.font = "bold 26px sans-serif";
            c.fillText(activeText, width / 2, 160);
            c.restore();
          }
          if (catIntroImg) {
            const bob = Math.sin(timeSec * 5) * 8;
            c.drawImage(catIntroImg, width / 2 - 160, height - 280 + bob, 320, 320);
          }
        };

        const drawProceduralMain = (c: CanvasRenderingContext2D, timeSec: number, w: number, h: number) => {
          c.fillStyle = "#F43F5E";
          c.fillRect(-w / 2, -h / 2, w, h);
          if (catMainImg) {
            const bob = Math.sin(timeSec * 4.5) * 6;
            c.drawImage(catMainImg, -70, h / 2 - 150 + bob, 140, 140);
          }
        };

        const drawMainFrameInternals = (c: CanvasRenderingContext2D) => {
          c.fillStyle = "#FFFFFF";
          c.fillRect(0, 0, vWidth, vHeight);
          
          c.fillStyle = "#FDA4AF";
          flowerParams.forEach((f) => {
            f.y += f.speedY;
            if (f.y > vHeight) f.y = -20;
            c.beginPath();
            c.arc(f.x, f.y, f.size * 0.4, 0, Math.PI * 2);
            c.fill();
          });

          c.save();
          const swingAngle = Math.sin(phaseTime * 1.25) * 11;
          const swingRad = (swingAngle * Math.PI) / 180;
          c.translate(270, 100);
          c.rotate(swingRad);
          c.translate(0, 380);

          c.fillStyle = "#FFFFFF";
          c.beginPath();
          c.roundRect(-211, -370, 422, 740, [12]);
          c.fill();

          if (mainVideoEl.readyState >= 2) {
            c.save();
            c.beginPath();
            c.roundRect(-201, -359, 402, 718, [8]);
            c.clip();
            c.drawImage(mainVideoEl, -201, -359, 402, 718);
            c.restore();
          } else {
            drawProceduralMain(c, phaseTime, 402, 718);
          }

          if (config.instagramId) {
            c.save();
            c.fillStyle = "#1e293b";
            c.font = "bold 32px monospace";
            c.textAlign = "center";
            c.fillText("@" + config.instagramId, 0, -382);
            c.restore();
          }
          c.restore();

          const halfway = mainDuration / 2;
          const targetReaction = phaseTime < halfway ? reaction1 : reaction2;
          if (targetReaction) {
            c.drawImage(targetReaction, 270 - 103.5, 760, 207, 207);
          }
        };

        const drawOutroFrameInternals = (c: CanvasRenderingContext2D) => {
          if (outroVideoEl.readyState >= 2) {
            c.drawImage(outroVideoEl, 0, 0, vWidth, vHeight);
          } else {
            c.fillStyle = "#FFFFFF";
            c.fillRect(0, 0, vWidth, vHeight);
            c.fillStyle = "#000000";
            c.font = "bold 34px sans-serif";
            c.textAlign = "center";
            c.fillText("That's it for Today", vWidth / 2, 160);
            if (catOutroImg) {
              const bob = Math.sin(phaseTime * 5) * 8;
              c.drawImage(catOutroImg, vWidth / 2 - 160, vHeight - 280 + bob, 320, 320);
            }
          }
        };

        // Render decision
        if (currentPhase === "intro") {
          drawProceduralIntro(ctx, phaseTime, vWidth, vHeight);
        } else if (currentPhase === "wipe") {
          const p = phaseTime / TRANSITION_DURATION;
          drawProceduralIntro(ctx, phaseTime, vWidth, vHeight);
          ctx.save();
          ctx.beginPath();
          const wipeX = vWidth - p * (vWidth + 300);
          ctx.moveTo(wipeX, 0);
          ctx.lineTo(vWidth, 0);
          ctx.lineTo(vWidth, vHeight);
          ctx.lineTo(wipeX - 250, vHeight);
          ctx.closePath();
          ctx.clip();
          drawMainFrameInternals(ctx);
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(wipeX, 0);
          ctx.lineTo(wipeX - 250, vHeight);
          ctx.stroke();
          ctx.restore();
        } else if (currentPhase === "main") {
          if (inCrossfadeToOutro) {
            const p = (currentPlayhead - (mainEndTime - CROSSFADE_DURATION)) / CROSSFADE_DURATION;
            drawMainFrameInternals(ctx);
            ctx.save();
            ctx.globalAlpha = p;
            drawOutroFrameInternals(ctx);
            ctx.restore();
          } else {
            drawMainFrameInternals(ctx);
          }
        } else if (currentPhase === "outro") {
          drawOutroFrameInternals(ctx);
        }

        ctx.restore();
        requestAnimationFrame(runExportLoop);
      };

      requestAnimationFrame(runExportLoop);
    } catch (err: any) {
      console.error(err);
      try {
        if (cleanupDOMAndBlobUrls) cleanupDOMAndBlobUrls();
      } catch (e) {}
      setStatus({
        step: "failed",
        progress: 0,
        message: err.message || "An error occurred during video creation rendering.",
      });
    }
  };

  const handleCancelExport = () => {
    cancelExportRef.current = true;
    setStatus({ step: "idle", progress: 0, message: "" });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white" id="exporter-card">
      <div className="flex items-center gap-2 mb-4">
        <Film size={20} className="text-pink-400" />
        <h3 className="text-base font-bold text-white">Step 3: Compile &amp; Export Final Reel</h3>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mb-5">
        Export compiles all sequence layers, wipe transitions, falling flowers, and reacting avatars directly inside your browser. No data is sent to servers.
      </p>

      {status.step === "idle" && (
        <div className="space-y-3 mb-5" id="export-format-selector">
          <label className="text-xs font-semibold text-slate-300 block">Select Preferred Video Format:</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setSelectedFormat("mp4");
                setExportedFilename("compiled_reaction_reel.mp4");
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                selectedFormat === "mp4"
                  ? "bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-md shadow-pink-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              MP4 Format (Highly Compatible)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFormat("webm");
                setExportedFilename("compiled_reaction_reel.webm");
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                selectedFormat === "webm"
                  ? "bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-md shadow-pink-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              WebM Format (Alternative)
            </button>
          </div>
        </div>
      )}

      {status.step === "idle" && (
        <button
          onClick={startExport}
          className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-700 hover:to-violet-700 font-semibold rounded-lg text-sm transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 cursor-pointer"
        >
          <Sparkles size={16} />
          Convert &amp; Export Video Reel (.{selectedFormat})
        </button>
      )}

      {/* RENDER PROGRESS SECTION */}
      {(status.step === "loading" || status.step === "rendering") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Loader2 size={14} className="animate-spin text-pink-400" />
              {status.message}
            </span>
            <span className="font-mono text-pink-400 font-bold">{status.progress}%</span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 h-full transition-all duration-150"
              style={{ width: `${status.progress}%` }}
            />
          </div>

          {status.step === "rendering" && (
            <div className="p-3 bg-pink-950/25 border border-pink-900/35 rounded-lg text-[11px] text-pink-300 space-y-1 my-2">
              <p className="font-semibold flex items-center gap-1.5 text-pink-200">
                <Sparkles size={12} className="text-pink-400 animate-pulse" />
                Keep This Tab Active For Perfect Render
              </p>
              <p className="opacity-80 leading-normal">
                Web browsers throttle animations in background tabs to save battery. Keep this page visible and in focus for a buttery-smooth, unthrottled video capture!
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleCancelExport}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded font-medium transition-colors"
            >
              Cancel Composition
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED EXPORT */}
      {status.step === "completed" && downloadUrl && (
        <div className="space-y-4 bg-emerald-950/40 border border-emerald-800 p-4 rounded-xl">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-300">Video compiled successfully!</p>
              <p className="text-xs text-emerald-400 leading-normal">
                Click Download below to save your vertical high resolution compilation video.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <a
              href={downloadUrl}
              download={exportedFilename}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs leading-none text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              Download Video Reel (.{selectedFormat})
            </a>

            <button
              onClick={() => setStatus({ step: "idle", progress: 0, message: "" })}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCcw size={13} />
              Compile New Reel
            </button>
          </div>
          
          <div className="flex items-start gap-1.5 p-2 bg-emerald-950/20 rounded border border-emerald-900/40 text-[10px] text-emerald-400">
            <HelpCircle size={12} className="shrink-0 mt-0.5" />
            <p>
              {selectedFormat === "mp4" ? (
                <span>Delivered as a premium high-compatibility <b>MP4</b> file, optimized for Instagram Reels, YouTube Shorts, TikTok, and standard mobile players.</span>
              ) : (
                <span>Delivered as a high-efficiency <b>WebM</b> file. Widely supported on modern web browsers and mobile application uploading platforms.</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* FAILURE BANNER */}
      {status.step === "failed" && (
        <div className="space-y-3 bg-rose-950/50 border border-rose-900 p-4 rounded-xl">
          <p className="text-xs text-rose-300 font-semibold">{status.message}</p>
          <button
            onClick={() => setStatus({ step: "idle", progress: 0, message: "" })}
            className="w-full py-2 bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Reset and Try Again
          </button>
        </div>
      )}
    </div>
  );
};
