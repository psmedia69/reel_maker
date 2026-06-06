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

      // 1. Create offline compilation canvas matching 1080x1920 (High Definition)
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D context.");

      // Logical drawing coordinate space match virtual 540x960 (we will scale everything by 2x)
      const vWidth = 540;
      const vHeight = 960;

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
      // High-quality bitrate for 1080x1920 HD vertical format (8.5 Mbps - crisp and sharp)
      recorderOptions.videoBitsPerSecond = 8500000;

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
      let currentPlayhead = 0;
      let isRecording = true;
      let lastProgressPercentage = -1;
      let lastSecondValue = -1;

      // Realtime frame composition render pipeline
      const runRealtimeLoop = async () => {
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

        const now = performance.now();
        let delta = (now - lastFrameTime) / 1000;
        if (delta > 0.1) delta = 0.1; // Cap delta to prevent massive skips on CPU hiccups
        lastFrameTime = now;

        // Master playback timeline is driven strictly and linearly by the physical clock delta OR media lock
        let updatedFromMedia = false;
        if (currentPlayhead < INTRO_DURATION) {
          if (config.introVideo.url && !activeIntroEl.paused && activeIntroEl.readyState >= 2) {
            currentPlayhead = activeIntroEl.currentTime;
            updatedFromMedia = true;
          }
        } else if (currentPlayhead < INTRO_DURATION + mainDuration) {
          if (config.mainVideo.url && !mainVideoEl.paused && mainVideoEl.readyState >= 2) {
            currentPlayhead = INTRO_DURATION + mainVideoEl.currentTime;
            updatedFromMedia = true;
          }
        } else {
          if (config.outroVideo.url && !outroVideoEl.paused && outroVideoEl.readyState >= 2) {
            currentPlayhead = INTRO_DURATION + mainDuration + outroVideoEl.currentTime;
            updatedFromMedia = true;
          }
        }

        if (!updatedFromMedia) {
          currentPlayhead += delta;
        }

        // Determine current phase based strictly on the playhead
        let currentPhase: "intro" | "wipe" | "main" | "outro" = "intro";
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

        // End rendering when recording limit is reached (guarantees perfect duration output)
        if (currentPlayhead >= totalDuration) {
          isRecording = false;
          mediaRecorder.stop();
          setStatus({ step: "rendering", progress: 95, message: "Finalizing video file formatting..." });
          
          if (config.introVideo.url) { try { activeIntroEl.pause(); } catch(e) {} }
          if (config.mainVideo.url) { try { mainVideoEl.pause(); } catch(e) {} }
          if (config.outroVideo.url) { try { outroVideoEl.pause(); } catch(e) {} }

          const { objectUrl, actualExt } = await recordedPromise;
          
          if (cleanupDOMAndBlobUrls) cleanupDOMAndBlobUrls();
          
          try {
            audioCtx.close();
          } catch(e) {}

          setDownloadUrl(objectUrl);
          setExportedFilename(`compiled_reaction_reel.${actualExt}`);
          setStatus({
            step: "completed",
            progress: 100,
            message: "Reel exported successfully with synchronized high-quality audio!",
          });
          return;
        }

        const progressPercentage = Math.round(20 + (Math.min(totalDuration, currentPlayhead) / totalDuration) * 75);
        const currentSecond = Math.floor(currentPlayhead);
        
        if (progressPercentage !== lastProgressPercentage || currentSecond !== lastSecondValue) {
          lastProgressPercentage = progressPercentage;
          lastSecondValue = currentSecond;
          setStatus({
            step: "rendering",
            progress: progressPercentage,
            message: `Encoding... (${currentSecond}s / ${Math.round(totalDuration)}s)`,
          });
        }

        // Recalculate phase parameters based on synced playhead
        let phaseTime = 0;
        if (currentPhase === "intro") {
          phaseTime = currentPlayhead;
        } else if (currentPhase === "wipe" || currentPhase === "main") {
          phaseTime = currentPlayhead - INTRO_DURATION;
        } else {
          phaseTime = Math.min(OUTRO_DURATION, currentPlayhead - (INTRO_DURATION + mainDuration));
        }

        // Direct hardware unblocked playhead operations based on the verified active phase
        if (currentPhase === "intro") {
          if (config.introVideo.url) {
            if (activeIntroEl.paused) activeIntroEl.play().catch(() => {});
            gainIntro.gain.value = config.audioMixVolume;
            const targetSeek = phaseTime;
            if (Math.abs(activeIntroEl.currentTime - targetSeek) > 1.5) {
              activeIntroEl.currentTime = targetSeek;
            }
          }
          if (config.mainVideo.url && !mainVideoEl.paused) { try { mainVideoEl.pause(); } catch(e) {} }
          if (config.outroVideo.url && !outroVideoEl.paused) { try { outroVideoEl.pause(); } catch(e) {} }
          gainMain.gain.value = 0;
          gainOutro.gain.value = 0;
        } else if (currentPhase === "wipe") {
          if (config.introVideo.url && !activeIntroEl.paused) { try { activeIntroEl.pause(); } catch(e) {} }
          gainIntro.gain.value = 0;

          if (config.mainVideo.url) {
            if (mainVideoEl.paused) mainVideoEl.play().catch(() => {});
            gainMain.gain.value = config.audioMixVolume;
            const targetSeek = phaseTime;
            if (Math.abs(mainVideoEl.currentTime - targetSeek) > 1.5) {
              mainVideoEl.currentTime = targetSeek;
            }
          }
          if (config.outroVideo.url && !outroVideoEl.paused) { try { outroVideoEl.pause(); } catch(e) {} }
          gainOutro.gain.value = 0;
        } else if (currentPhase === "main") {
          if (config.introVideo.url && !activeIntroEl.paused) { try { activeIntroEl.pause(); } catch(e) {} }
          gainIntro.gain.value = 0;

          if (config.mainVideo.url) {
            if (mainVideoEl.paused) mainVideoEl.play().catch(() => {});
            gainMain.gain.value = config.audioMixVolume;
            const targetSeek = phaseTime;
            if (Math.abs(mainVideoEl.currentTime - targetSeek) > 1.5) {
              mainVideoEl.currentTime = targetSeek;
            }
          }
          if (config.outroVideo.url && !outroVideoEl.paused) { try { outroVideoEl.pause(); } catch(e) {} }
          gainOutro.gain.value = 0;
        } else if (currentPhase === "outro") {
          if (config.introVideo.url && !activeIntroEl.paused) { try { activeIntroEl.pause(); } catch(e) {} }
          if (config.mainVideo.url && !mainVideoEl.paused) { try { mainVideoEl.pause(); } catch(e) {} }
          gainIntro.gain.value = 0;
          gainMain.gain.value = 0;

          if (config.outroVideo.url) {
            if (outroVideoEl.paused) outroVideoEl.play().catch(() => {});
            gainOutro.gain.value = config.audioMixVolume;
            const targetSeek = phaseTime;
            if (Math.abs(outroVideoEl.currentTime - targetSeek) > 1.5) {
              outroVideoEl.currentTime = targetSeek;
            }
          }
        }

        // Clears Canvas & set high resolution crisp quality settings (2x scale for 1080p output)
        ctx.save();
        ctx.scale(2, 2);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, vWidth, vHeight);

        // Procedural Drawing fallbacks
        const drawProceduralIntro = (c: CanvasRenderingContext2D, timeSec: number, width: number, height: number) => {
          c.fillStyle = "#82a1bc"; // Beautiful soothing light sky-blue background matching 1.mp4
          c.fillRect(0, 0, width, height);

          // Subtitle Text exactly matching 1.mp4 audio query structure
          c.fillStyle = "#FFFFFF";
          c.strokeStyle = "#0F172A";
          c.lineWidth = 10;
          c.lineJoin = "round";
          c.textAlign = "center";
          c.textBaseline = "middle";

          const primaryText = "Aaj ki princess kaun hai ?";
          const secondaryText = "";

          const activeText = timeSec < 2.2 ? primaryText : secondaryText;

          if (activeText) {
            const cx = width / 2;
            const cy = 160;
            const rx = 190;
            const ry = 55;

            // Helper to draw a tiny fluffy thought cloud
            const drawSmallFluffyCloud = (cCtx: CanvasRenderingContext2D, sX: number, sY: number, sR: number) => {
              cCtx.save();
              cCtx.fillStyle = "#FFFFFF";
              cCtx.strokeStyle = "#0F172A";
              cCtx.lineWidth = 4;
              cCtx.lineCap = "round";
              cCtx.lineJoin = "round";

              cCtx.beginPath();
              // Trace overlapping circle paths to form a cute naturally shaped tiny cloud
              cCtx.arc(sX, sY, sR, 0, Math.PI * 2);
              cCtx.arc(sX - sR * 0.5, sY + sR * 0.1, sR * 0.7, 0, Math.PI * 2);
              cCtx.arc(sX + sR * 0.5, sY + sR * 0.1, sR * 0.7, 0, Math.PI * 2);
              cCtx.arc(sX, sY - sR * 0.3, sR * 0.8, 0, Math.PI * 2);
              cCtx.fill();
              cCtx.stroke();

              // Clear internal overlapping stroke lines
              cCtx.fillStyle = "#FFFFFF";
              cCtx.beginPath();
              cCtx.arc(sX, sY, sR - 1, 0, Math.PI * 2);
              cCtx.arc(sX - sR * 0.5, sY + sR * 0.1, sR * 0.7 - 1, 0, Math.PI * 2);
              cCtx.arc(sX + sR * 0.5, sY + sR * 0.1, sR * 0.7 - 1, 0, Math.PI * 2);
              cCtx.arc(sX, sY - sR * 0.3, sR * 0.8 - 1, 0, Math.PI * 2);
              cCtx.fill();
              cCtx.restore();
            };

            // Draw the main beautiful puffy oval thought cloud
            c.save();
            c.fillStyle = "#FFFFFF";
            c.strokeStyle = "#0F172A";
            c.lineWidth = 5;
            c.lineCap = "round";
            c.lineJoin = "round";

            // Define perfect cloud boundary lobe positions along the ellipse
            const lobes = [
              { angle: 0, r: 35 },
              { angle: Math.PI * 0.16, r: 33 },
              { angle: Math.PI * 0.33, r: 37 },
              { angle: Math.PI * 0.5, r: 33 },
              { angle: Math.PI * 0.66, r: 37 },
              { angle: Math.PI * 0.83, r: 33 },
              { angle: Math.PI, r: 35 },
              { angle: Math.PI * 1.16, r: 33 },
              { angle: Math.PI * 1.33, r: 37 },
              { angle: Math.PI * 1.5, r: 33 },
              { angle: Math.PI * 1.66, r: 37 },
              { angle: Math.PI * 1.83, r: 33 }
            ];

            // Fill base ellipse
            c.beginPath();
            c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            c.fill();

            // Stroke and fill lobes (this outlines the outer bounds with puffy cloud shapes)
            lobes.forEach(l => {
              const lx = cx + Math.cos(l.angle) * rx;
              const ly = cy + Math.sin(l.angle) * ry;
              c.beginPath();
              c.arc(lx, ly, l.r, 0, Math.PI * 2);
              c.fill();
              c.stroke();
            });

            // Mask inner stroke overlaps for flawless presentation
            c.fillStyle = "#FFFFFF";
            c.beginPath();
            c.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, Math.PI * 2);
            c.fill();

            lobes.forEach(l => {
              const lx = cx + Math.cos(l.angle) * rx;
              const ly = cy + Math.sin(l.angle) * ry;
              c.beginPath();
              c.arc(lx, ly, l.r - 2, 0, Math.PI * 2);
              c.fill();
            });

            c.restore();

            // Draw 3 tiny clouds of decreasing size heading towards the cat
            drawSmallFluffyCloud(c, cx - 15, cy + ry + 25, 18);
            drawSmallFluffyCloud(c, cx - 40, cy + ry + 65, 12);
            drawSmallFluffyCloud(c, cx - 60, cy + ry + 100, 7);

            // Write text inside the bubble
            c.save();
            c.fillStyle = "#0F172A";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.font = "bold 26px 'Space Grotesk', 'Inter', Arial, sans-serif";
            c.fillText(activeText, cx, cy);
            c.restore();
          }

          // Floating ambient white sparkles
          c.fillStyle = "rgba(255, 255, 255, 0.35)";
          for (let i = 0; i < 10; i++) {
            const shiftY = ((timeSec * 30 * 1.5 + i * 100) % height);
            const shiftX = (Math.sin(timeSec * 30 * 0.03 + i) * 30 + (i * 60)) % width;
            c.beginPath();
            c.arc(shiftX, shiftY, 5, 0, Math.PI * 2);
            c.fill();
          }

          if (catIntroImg) {
            const bob = Math.sin(timeSec * 30 * 0.15) * 8;
            const size = 320;
            const startX = width / 2 - size / 2;
            const startY = height - size + 40 + bob;
            c.drawImage(catIntroImg, startX, startY, size, size);

            // Eye blinking every 3.5 seconds
            const isBlinking = (Math.floor(timeSec * 30) % 105) < 8;
            if (isBlinking) {
              c.save();
              c.fillStyle = "#374151"; 
              c.strokeStyle = "#111827"; 
              c.lineWidth = 5;
              c.lineCap = "round";

              const eyeL_X = startX + (155 * 0.8);
              const eyeL_Y = startY + (175 * 0.8) - 10;
              c.beginPath();
              c.arc(eyeL_X, eyeL_Y, 23, 0, Math.PI * 2);
              c.fill();
              
              c.beginPath();
              c.arc(eyeL_X, eyeL_Y, 20, 0.15 * Math.PI, 0.85 * Math.PI);
              c.stroke();

              const eyeR_X = startX + (245 * 0.8);
              const eyeR_Y = startY + (175 * 0.8) - 10;
              c.beginPath();
              c.arc(eyeR_X, eyeR_Y, 23, 0, Math.PI * 2);
              c.fill();

              c.beginPath();
              c.arc(eyeR_X, eyeR_Y, 20, 0.15 * Math.PI, 0.85 * Math.PI);
              c.stroke();

              c.restore();
            }

            // Floating animated question marks
            c.save();
            const headX = width / 2;
            const headY = startY + 60;
            const qFrame = Math.floor(timeSec * 30) % 90;
            const qAlpha = qFrame < 60 ? qFrame / 15 : (90 - qFrame) / 30;
            const qOffset = (qFrame / 90) * 50;
            
            c.globalAlpha = Math.max(0, Math.min(1, qAlpha));
            c.fillStyle = "#FBBF24"; 
            c.strokeStyle = "#111827";
            c.lineWidth = 6;
            c.lineJoin = "round";
            c.font = "bold 34px 'Space Grotesk', Arial, sans-serif";
            c.textAlign = "center";
            c.textBaseline = "middle";
            
            const qX = headX + Math.sin(timeSec * 30 * 0.04) * 25 - 40;
            const qY = headY - 100 - qOffset;
            
            c.strokeText("?", qX, qY);
            c.fillText("?", qX, qY);
            c.restore();
          }
        };

        const drawProceduralOutro = (c: CanvasRenderingContext2D, timeSec: number, width: number, height: number) => {
          c.fillStyle = "#FFFFFF";
          c.fillRect(0, 0, width, height);

          // Falling confetti
          for (let i = 0; i < 20; i++) {
            const color = ["#FB7185", "#38BDF8", "#34D399", "#FBBF24", "#C084FC"][i % 5];
            c.fillStyle = color;
            const shiftY = ((timeSec * 30 * 3 + i * 110) % height);
            const shiftX = (Math.sin(timeSec * 30 * 0.04 + i) * 40 + (i * 35)) % width;
            c.fillRect(shiftX, shiftY, 8, 12);
          }

          c.fillStyle = "#000000";
          c.strokeStyle = "#FFFFFF";
          c.lineWidth = 4;
          c.font = "bold 34px 'Space Grotesk', Impact, sans-serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.strokeText("That's it for Today", width / 2, 160);
          c.fillText("That's it for Today", width / 2, 160);

          c.font = "500 28px 'Inter', Arial, sans-serif";
          c.fillStyle = "#4B5563";
          c.fillText("See you Tomorrow", width / 2, 230);

          if (catOutroImg) {
            const bob = Math.sin(timeSec * 30 * 0.15) * 8;
            const size = 320;
            const startX = width / 2 - size / 2;
            const startY = height - size + 40 + bob;
            c.drawImage(catOutroImg, startX, startY, size, size);
          }
        };

        const drawProceduralMain = (c: CanvasRenderingContext2D, timeSec: number, w: number, h: number) => {
          const gradient = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
          gradient.addColorStop(0, "#F43F5E");
          gradient.addColorStop(0.5, "#EC4899");
          gradient.addColorStop(1, "#D946EF");
          c.fillStyle = gradient;
          c.fillRect(-w / 2, -h / 2, w, h);

          // Rotating card
          c.save();
          c.rotate(timeSec * 0.9);
          c.fillStyle = "#FFFFFF";
          c.shadowColor = "rgba(0,0,0,0.3)";
          c.shadowBlur = 30;
          c.fillRect(-80, -80, 160, 160);
          
          c.fillStyle = "#1E293B";
          c.font = "bold 16px 'Inter', sans-serif";
          c.textAlign = "center";
          c.fillText("CAMERA REEL", 0, -15);
          c.font = "12px 'JetBrains Mono', monospace";
          c.fillText("00:" + String(Math.floor(timeSec)).padStart(2, "0"), 0, 15);
          c.restore();

          if (catMainImg) {
            const bob = Math.sin(timeSec * 4.5) * 6;
            c.drawImage(catMainImg, -70, h / 2 - 150 + bob, 140, 140);
          }
        };

        // Core Drawing blocks
        const drawIntroFrame = () => {
          // Visually ALWAYS draw the beautiful, elegant procedural cat intro (retaining the animated cat and thoughts),
          // while any uploaded intro video or audio track's sound/voice plays perfectly in the background!
          drawProceduralIntro(ctx, phaseTime, vWidth, vHeight);
        };

        const drawMainFrame = () => {
          // 1. Draw white background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, vWidth, vHeight);

          // 2. Draw fallen pink petals with animation
          ctx.fillStyle = "#FDA4AF";
          flowerParams.forEach((flower) => {
            flower.y += flower.speedY;
            flower.x += flower.speedX;
            flower.rot += flower.rotSpeed;

            if (flower.y > vHeight + 20) {
              flower.y = -20;
              flower.x = Math.random() * vWidth;
            }

            ctx.save();
            ctx.translate(flower.x, flower.y);
            ctx.rotate(flower.rot);
            
            // Render sakura wind-swept petal shape
            ctx.beginPath();
            ctx.ellipse(0, 0, flower.size * 0.7, flower.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            // central core shape shadow highlight
            ctx.fillStyle = "#F43F5E";
            ctx.beginPath();
            ctx.ellipse(flower.size * 0.15, 0, flower.size * 0.22, flower.size * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            ctx.fillStyle = "#FDA4AF";
          });

          // 2.5 Draw beautiful romantic pink and reddish hearts
          heartParams.forEach((heart) => {
            heart.y += heart.speedY;
            heart.x += heart.speedX;
            heart.rot += heart.rotSpeed;

            if (heart.y > vHeight + 20) {
              heart.y = -20;
              heart.x = Math.random() * vWidth;
            }

            ctx.save();
            ctx.translate(heart.x, heart.y);
            ctx.rotate(heart.rot);
            
            ctx.fillStyle = heart.color;
            ctx.beginPath();
            ctx.moveTo(0, -heart.size * 0.2);
            ctx.bezierCurveTo(-heart.size * 0.5, -heart.size * 0.7, -heart.size, -heart.size * 0.15, 0, heart.size * 0.75);
            ctx.bezierCurveTo(heart.size, -heart.size * 0.15, heart.size * 0.5, -heart.size * 0.7, 0, -heart.size * 0.2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          });

          // 3. Draw RHS video tilted leaning / swinging like a pendulum
          ctx.save();
          
          // Slow pendulum swing pace
          const swingAngle = Math.sin(phaseTime * 1.25) * 11; // slow pendulum pace, max 11 degrees
          const swingRad = (swingAngle * Math.PI) / 180;
          
          // Pivot at the top middle of the screen
          const pivotX = 270;
          const pivotY = 100;
          const localCenterX = 0;
          const localCenterY = 380;
          const rotatedCenterX = localCenterX * Math.cos(swingRad) - localCenterY * Math.sin(swingRad);
          const rotatedCenterY = localCenterX * Math.sin(swingRad) + localCenterY * Math.cos(swingRad);
          const footageX = pivotX + rotatedCenterX;
          const footageY = pivotY + rotatedCenterY;
          
          ctx.translate(pivotX, pivotY);
          ctx.rotate(swingRad);
          // Original center of footage card was (335, 480). 
          // Relative to pivot (270, 100), the offset vector is (335 - 270, 480 - 100) = (65, 380). Centering it fully is offset (0, 380)
          ctx.translate(localCenterX, localCenterY);

          // Zero-overhead beautiful flat card dropshadow
          ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
          ctx.beginPath();
          ctx.roundRect(-198 + 10, -342 + 12, 396, 684, [16]);
          ctx.fill();

          // White bordered board backplate
          ctx.fillStyle = "#E4E4E7";
          ctx.beginPath();
          ctx.roundRect(-198, -342, 396, 684, [16]);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(-192, -336, 384, 672, [12]);
          ctx.fill();

          // Draw main footage in crisp interpolation
          if (mainVideoEl.src && config.mainVideo.url) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(-182.5, -326.5, 365, 653, [8]);
            ctx.clip();
            ctx.drawImage(mainVideoEl, -182.5, -326.5, 365, 653);
            ctx.restore();
          } else {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(-182.5, -326.5, 365, 653, [8]);
            ctx.clip();
            drawProceduralMain(ctx, phaseTime, 365, 653);
            ctx.restore();
          }

          // Draw the minimal Instagram ID in matching swing pendulum motion inside export
          if (config.instagramId) {
            const trimmed = config.instagramId.trim();
            if (trimmed) {
              const displayId = "@" + trimmed;
              ctx.save();
              ctx.fillStyle = "#1e293b"; // Rich ultra-dark slate-800
              ctx.font = "bold 29px 'JetBrains Mono', monospace";
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              
              // Clean high-contrast drop shadow for maximum outdoor/indoor legibility
              ctx.shadowColor = "rgba(255, 255, 255, 1.0)";
              ctx.shadowBlur = 6;
              
              // Rendered closer to the card border (which is at -326.5 px)
              ctx.fillText(displayId, 0, -360);
              ctx.restore();
            }
          }

          ctx.restore();

          // 4. Draw overlays (LHS below corner) with smooth popup & scale before transition
          const halfway = mainDuration / 2;
          const targetImg = phaseTime < halfway ? reaction1 : reaction2;

          let baseScale = 1.0;
          const introFadeDuration = 0.6;
          const outroFadeDuration = 0.6;

          if (phaseTime < introFadeDuration) {
            const t = phaseTime / introFadeDuration;
            baseScale = Math.sin(t * Math.PI * 0.5) * 1.15 - 0.15 * (1 - t) * (1 - t);
          } else if (phaseTime > mainDuration - outroFadeDuration) {
            const timeLeft = mainDuration - phaseTime;
            const t = Math.max(0, timeLeft / outroFadeDuration);
            baseScale = t * t;
          }

          let swapScale = 1.0;
          const timeSinceHalfway = Math.abs(phaseTime - halfway);
          if (timeSinceHalfway < 0.4) {
            const t = timeSinceHalfway / 0.4;
            swapScale = 0.6 + 0.4 * Math.sin(t * Math.PI * 0.5);
          }

          const combinedScale = baseScale * swapScale;

          if (combinedScale > 0.001) {
            ctx.save();
            const size = 230;
            const px = 270 - size / 2;
            const py = 760;

            // Zero-overhead high-precision flat dropshadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
            ctx.beginPath();
            ctx.arc(px + size / 2 + 5, py + size / 2 + 6, size / 2, 0, Math.PI * 2);
            ctx.fill();

            const originX = px + size / 2;
            const originY = py + size / 2;
            const sizeFactor = size / 400;

            ctx.translate(originX, originY);
            ctx.scale(combinedScale, combinedScale);
            ctx.translate(-originX, -originY);

            ctx.drawImage(targetImg, px, py, size, size);

            // Dynamic tracking pupils! We determine if default surprised/shocked cat is active
            const reactionUrl = phaseTime < halfway ? config.reaction1.url : config.reaction2.url;
            const isSurprised = reactionUrl.includes("2.png") || reactionUrl.toLowerCase().includes("surprise");
            const isShocked = reactionUrl.includes("3.png") || reactionUrl.toLowerCase().includes("shock");

            // Cozy animated eye blinking calculation
            const blinkPeriod = 4.0;
            const blinkDuration = 0.28;
            const cycleTime = phaseTime % blinkPeriod;
            let blinkProgress = 0; // 0 = open, 1 = shut
            if (cycleTime < blinkDuration) {
              const halfDuration = blinkDuration / 2;
              if (cycleTime < halfDuration) {
                blinkProgress = cycleTime / halfDuration;
              } else {
                blinkProgress = (blinkDuration - cycleTime) / halfDuration;
              }
            }

            if (isSurprised) {
              // Left Eye and pupil tracking
              const locLeftX = px + 155 * sizeFactor;
              const locLeftY = py + 175 * sizeFactor;
              const gLeftX = originX + (locLeftX - originX) * combinedScale;
              const gLeftY = originY + (locLeftY - originY) * combinedScale;
              const dxL = footageX - gLeftX;
              const dyL = footageY - gLeftY;
              const distL = Math.sqrt(dxL * dxL + dyL * dyL) || 1;
              const maxShiftL = 12 * sizeFactor;
              const shiftXL = (dxL / distL) * maxShiftL;
              const shiftYL = (dyL / distL) * maxShiftL;

              // Override / Erase static pupils with base gold color
              ctx.fillStyle = "#F59E0B";
              ctx.beginPath();
              ctx.arc(locLeftX, locLeftY, 28 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              // Draw tracking pupil (black ellipse) and highlight (white)
              ctx.fillStyle = "#0F172A";
              ctx.beginPath();
              ctx.ellipse(locLeftX + shiftXL, locLeftY + shiftYL, 14 * sizeFactor, 18 * sizeFactor, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#FFFFFF";
              ctx.beginPath();
              ctx.arc(locLeftX + shiftXL - 6 * sizeFactor, locLeftY + shiftYL - 6 * sizeFactor, 6 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              // Cute smooth eyelid closing overlay for surprised cat left eye
              if (blinkProgress > 0.01) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(locLeftX, locLeftY, 28 * sizeFactor, 0, Math.PI * 2);
                ctx.clip();

                ctx.fillStyle = "#E4E4E5"; // Light fur/lid color matching reactive face
                ctx.fillRect(locLeftX - 35 * sizeFactor, locLeftY - 35 * sizeFactor, 70 * sizeFactor, 70 * sizeFactor * blinkProgress);

                // Eyelash/lash line
                ctx.strokeStyle = "#1E293B";
                ctx.lineWidth = 3.5 * sizeFactor;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(locLeftX - 30 * sizeFactor, locLeftY - 28 * sizeFactor + 56 * sizeFactor * blinkProgress);
                ctx.lineTo(locLeftX + 30 * sizeFactor, locLeftY - 28 * sizeFactor + 56 * sizeFactor * blinkProgress);
                ctx.stroke();
                ctx.restore();
              }

              // Right Eye and pupil tracking
              const locRightX = px + 245 * sizeFactor;
              const locRightY = py + 175 * sizeFactor;
              const gRightX = originX + (locRightX - originX) * combinedScale;
              const gRightY = originY + (locRightY - originY) * combinedScale;
              const dxR = footageX - gRightX;
              const dyR = footageY - gRightY;
              const distR = Math.sqrt(dxR * dxR + dyR * dyR) || 1;
              const maxShiftR = 12 * sizeFactor;
              const shiftXR = (dxR / distR) * maxShiftR;
              const shiftYR = (dyR / distR) * maxShiftR;

              ctx.fillStyle = "#F59E0B";
              ctx.beginPath();
              ctx.arc(locRightX, locRightY, 28 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#0F172A";
              ctx.beginPath();
              ctx.ellipse(locRightX + shiftXR, locRightY + shiftYR, 14 * sizeFactor, 18 * sizeFactor, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#FFFFFF";
              ctx.beginPath();
              ctx.arc(locRightX + shiftXR - 6 * sizeFactor, locRightY + shiftYR - 6 * sizeFactor, 6 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              // Cute smooth eyelid closing overlay for surprised cat right eye
              if (blinkProgress > 0.01) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(locRightX, locRightY, 28 * sizeFactor, 0, Math.PI * 2);
                ctx.clip();

                ctx.fillStyle = "#E4E4E5";
                ctx.fillRect(locRightX - 35 * sizeFactor, locRightY - 35 * sizeFactor, 70 * sizeFactor, 70 * sizeFactor * blinkProgress);

                ctx.strokeStyle = "#1E293B";
                ctx.lineWidth = 3.5 * sizeFactor;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(locRightX - 30 * sizeFactor, locRightY - 28 * sizeFactor + 56 * sizeFactor * blinkProgress);
                ctx.lineTo(locRightX + 30 * sizeFactor, locRightY - 28 * sizeFactor + 56 * sizeFactor * blinkProgress);
                ctx.stroke();
                ctx.restore();
              }
            } else if (isShocked) {
              // Left Eye and pupil tracking
              const locLeftX = px + 150 * sizeFactor;
              const locLeftY = py + 175 * sizeFactor;
              const gLeftX = originX + (locLeftX - originX) * combinedScale;
              const gLeftY = originY + (locLeftY - originY) * combinedScale;
              const dxL = footageX - gLeftX;
              const dyL = footageY - gLeftY;
              const distL = Math.sqrt(dxL * dxL + dyL * dyL) || 1;
              const maxShiftL = 16 * sizeFactor;
              const shiftXL = (dxL / distL) * maxShiftL;
              const shiftYL = (dyL / distL) * maxShiftL;

              // Override / Erase static pupils with base gold color
              ctx.fillStyle = "#F59E0B";
              ctx.beginPath();
              ctx.arc(locLeftX, locLeftY, 32 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              // Draw shocked dynamic tracking pupil and highlight
              ctx.fillStyle = "#0F172A";
              ctx.beginPath();
              ctx.arc(locLeftX + shiftXL, locLeftY + shiftYL, 6 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#FFFFFF";
              ctx.beginPath();
              ctx.arc(locLeftX + shiftXL - 2 * sizeFactor, locLeftY + shiftYL - 2 * sizeFactor, 2 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              // Cute smooth eyelid closing overlay for shocked cat left eye
              if (blinkProgress > 0.01) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(locLeftX, locLeftY, 32 * sizeFactor, 0, Math.PI * 2);
                ctx.clip();

                ctx.fillStyle = "#E4E4E5";
                ctx.fillRect(locLeftX - 40 * sizeFactor, locLeftY - 40 * sizeFactor, 80 * sizeFactor, 80 * sizeFactor * blinkProgress);

                ctx.strokeStyle = "#1E293B";
                ctx.lineWidth = 3.5 * sizeFactor;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(locLeftX - 35 * sizeFactor, locLeftY - 32 * sizeFactor + 64 * sizeFactor * blinkProgress);
                ctx.lineTo(locLeftX + 35 * sizeFactor, locLeftY - 32 * sizeFactor + 64 * sizeFactor * blinkProgress);
                ctx.stroke();
                ctx.restore();
              }

              // Right Eye and pupil tracking
              const locRightX = px + 250 * sizeFactor;
              const locRightY = py + 175 * sizeFactor;
              const gRightX = originX + (locRightX - originX) * combinedScale;
              const gRightY = originY + (locRightY - originY) * combinedScale;
              const dxR = footageX - gRightX;
              const dyR = footageY - gRightY;
              const distR = Math.sqrt(dxR * dxR + dyR * dyR) || 1;
              const maxShiftR = 16 * sizeFactor;
              const shiftXR = (dxR / distR) * maxShiftR;
              const shiftYR = (dyR / distR) * maxShiftR;

              ctx.fillStyle = "#F59E0B";
              ctx.beginPath();
              ctx.arc(locRightX, locRightY, 32 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#0F172A";
              ctx.beginPath();
              ctx.arc(locRightX + shiftXR, locRightY + shiftYR, 6 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#FFFFFF";
              ctx.beginPath();
              ctx.arc(locRightX + shiftXR - 2 * sizeFactor, locRightY + shiftYR - 2 * sizeFactor, 2 * sizeFactor, 0, Math.PI * 2);
              ctx.fill();

              // Cute smooth eyelid closing overlay for shocked cat right eye
              if (blinkProgress > 0.01) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(locRightX, locRightY, 32 * sizeFactor, 0, Math.PI * 2);
                ctx.clip();

                ctx.fillStyle = "#E4E4E5";
                ctx.fillRect(locRightX - 40 * sizeFactor, locRightY - 40 * sizeFactor, 80 * sizeFactor, 80 * sizeFactor * blinkProgress);

                ctx.strokeStyle = "#1E293B";
                ctx.lineWidth = 3.5 * sizeFactor;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(locRightX - 35 * sizeFactor, locRightY - 32 * sizeFactor + 64 * sizeFactor * blinkProgress);
                ctx.lineTo(locRightX + 35 * sizeFactor, locRightY - 32 * sizeFactor + 64 * sizeFactor * blinkProgress);
                ctx.stroke();
                ctx.restore();
              }
            }

            ctx.restore();
          }
        };

        const drawOutroFrame = () => {
          if (outroVideoEl.src && config.outroVideo.url) {
            ctx.drawImage(outroVideoEl, 0, 0, vWidth, vHeight);
          } else {
            drawProceduralOutro(ctx, phaseTime, vWidth, vHeight);
          }
        };

        // Render phase
        if (currentPhase === "intro") {
          drawIntroFrame();
        } else if (currentPhase === "wipe") {
          const p = phaseTime / TRANSITION_DURATION;
          drawIntroFrame();

          ctx.save();
          ctx.beginPath();
          const wipeX = vWidth - p * (vWidth + 300);

          ctx.moveTo(wipeX, 0);
          ctx.lineTo(vWidth, 0);
          ctx.lineTo(vWidth, vHeight);
          ctx.lineTo(wipeX - 250, vHeight);
          ctx.closePath();
          ctx.clip();

          drawMainFrame();
          ctx.restore();

          // Draw white wiper bar
          ctx.save();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 6;
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(wipeX, 0);
          ctx.lineTo(wipeX - 250, vHeight);
          ctx.stroke();
          ctx.restore();
        } else if (currentPhase === "main") {
          drawMainFrame();
        } else if (currentPhase === "outro") {
          drawOutroFrame();
        }

        ctx.restore();

        // Continue realtime capture on next repaint frame
        requestAnimationFrame(runRealtimeLoop);
      };

      // Launch sequential processing loop
      runRealtimeLoop();
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
