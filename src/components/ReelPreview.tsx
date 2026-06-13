import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, Film, Sparkles } from "lucide-react";
import { ReelConfig } from "../types";
import {
  DEFAULT_COOL_CAT_URL,
  DEFAULT_OUTRO_CAT_URL,
  DEFAULT_SURPRISED_CAT_URL,
} from "../utils/assets";

interface ReelPreviewProps {
  config: ReelConfig;
  onUpdateConfig: (updated: Partial<ReelConfig>) => void;
  isGeneratingDefaults: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rot: number;
  rotSpeed: number;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rot: number;
  rotSpeed: number;
  color: string;
}

export const ReelPreview: React.FC<ReelPreviewProps> = ({
  config,
  onUpdateConfig,
  isGeneratingDefaults,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Underneath HTML5 Native video/audio elements
  const introVideoEl = useRef<HTMLVideoElement | null>(null);
  const introAudioEl = useRef<HTMLAudioElement | null>(null);
  const mainVideoEl = useRef<HTMLVideoElement | null>(null);
  const outroVideoEl = useRef<HTMLVideoElement | null>(null);

  // Decal images
  const reaction1Img = useRef<HTMLImageElement | null>(null);
  const reaction2Img = useRef<HTMLImageElement | null>(null);

  // Procedural fallback drawing images
  const introCatImg = useRef<HTMLImageElement | null>(null);
  const outroCatImg = useRef<HTMLImageElement | null>(null);
  const mainCatImg = useRef<HTMLImageElement | null>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPhase, setPlaybackPhase] = useState<"intro" | "wipe" | "main" | "outro">("intro");
  const [timelinePercent, setTimelinePercent] = useState<number>(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);

  // High precision refs for requestAnimationFrame variables
  const isPlayingRef = useRef<boolean>(false);
  const playheadRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const heartsRef = useRef<HeartParticle[]>([]);

  // Smooth bounce factors for reaction pops
  const reactionScaleRef = useRef<number>(1.0);
  const lastActiveReactionRef = useRef<string>("none");
  const needsRenderRef = useRef<boolean>(true);
  const lastPhaseRef = useRef<string>("none");

  // Constant phase durations
  const INTRO_DURATION = config.introVideo.duration || 3.0;
  const TRANSITION_DURATION = config.transitionDuration || 1.2;
  const OUTRO_DURATION = config.outroVideo.duration || 2.0;
  
  const mainDuration = config.mainVideo.duration || 8.0;
  const totalDuration = INTRO_DURATION + mainDuration + OUTRO_DURATION;

  // Initialize HTML5 Native Videos as non-interactive backend decoders appended to body for Safari/Chrome compatibility
  useEffect(() => {
    const initVideo = (url: string) => {
      const video = document.createElement("video");
      if (url) {
        video.src = url;
      }
      video.crossOrigin = "anonymous";
      video.muted = true; // Auto-muted by default to pass initial autoplay rules
      video.playsInline = true;

      // Styling and appending to DOM stabilizes buffer load and audio context creation in mobile browsers.
      // To prevent browsers from throttling/suspending hidden offscreen videos, we keep them inside a micro active visible container.
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
      video.style.width = "160px";
      video.style.height = "90px";
      video.style.display = "block";
      video.style.opacity = "1.0";
      container.appendChild(video);

      if (url) {
        video.load();
      }
      return video;
    };

    const initAudio = (url: string) => {
      const audio = document.createElement("audio");
      if (url) {
        audio.src = url;
      }
      audio.crossOrigin = "anonymous";
      audio.muted = true; // Auto-muted by default to pass initial autoplay rules

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
      audio.style.width = "160px";
      audio.style.height = "90px";
      audio.style.display = "block";
      audio.style.opacity = "1.0";
      container.appendChild(audio);

      if (url) {
        audio.load();
      }
      return audio;
    };

    const introName = config.introVideo.name || "";
    const isIntroAudio = introName.endsWith(".mp3") || introName.endsWith(".wav") || introName.endsWith(".m4a") || introName.endsWith(".ogg") || (introName.endsWith(".webm") && !config.introVideo.url.includes("video"));

    if (isIntroAudio) {
      if (introVideoEl.current && introVideoEl.current.parentNode) {
        try { introVideoEl.current.parentNode.removeChild(introVideoEl.current); } catch(e) {}
      }
      introVideoEl.current = null;
      introAudioEl.current = initAudio(config.introVideo.url);
    } else {
      if (introAudioEl.current && introAudioEl.current.parentNode) {
        try { introAudioEl.current.parentNode.removeChild(introAudioEl.current); } catch(e) {}
      }
      introAudioEl.current = null;
      introVideoEl.current = initVideo(config.introVideo.url);
    }
    mainVideoEl.current = initVideo(config.mainVideo.url);
    outroVideoEl.current = initVideo(config.outroVideo.url);

    // Reactions Decals
    const img1 = new Image();
    img1.onload = () => { needsRenderRef.current = true; };
    img1.src = config.reaction1.url;
    reaction1Img.current = img1;

    const img2 = new Image();
    img2.onload = () => { needsRenderRef.current = true; };
    img2.src = config.reaction2.url;
    reaction2Img.current = img2;

    // Load procedural cats
    const catIntro = new Image();
    catIntro.onload = () => { needsRenderRef.current = true; };
    catIntro.src = DEFAULT_COOL_CAT_URL;
    introCatImg.current = catIntro;

    const catOutro = new Image();
    catOutro.onload = () => { needsRenderRef.current = true; };
    catOutro.src = DEFAULT_OUTRO_CAT_URL;
    outroCatImg.current = catOutro;

    const catMain = new Image();
    catMain.onload = () => { needsRenderRef.current = true; };
    catMain.src = DEFAULT_SURPRISED_CAT_URL;
    mainCatImg.current = catMain;

    return () => {
      if (introVideoEl.current) {
        introVideoEl.current.pause();
        if (introVideoEl.current.parentNode) {
          try { introVideoEl.current.parentNode.removeChild(introVideoEl.current); } catch(e) {}
        }
      }
      if (introAudioEl.current) {
        introAudioEl.current.pause();
        if (introAudioEl.current.parentNode) {
          try { introAudioEl.current.parentNode.removeChild(introAudioEl.current); } catch(e) {}
        }
      }
      if (mainVideoEl.current) {
        mainVideoEl.current.pause();
        if (mainVideoEl.current.parentNode) {
          try { mainVideoEl.current.parentNode.removeChild(mainVideoEl.current); } catch(e) {}
        }
      }
      if (outroVideoEl.current) {
        outroVideoEl.current.pause();
        if (outroVideoEl.current.parentNode) {
          try { outroVideoEl.current.parentNode.removeChild(outroVideoEl.current); } catch(e) {}
        }
      }
    };
  }, [config.introVideo.url, config.mainVideo.url, config.outroVideo.url, config.reaction1.url, config.reaction2.url]);

  // Seed romantic cherry blossoms particles strictly driven by parent config counts
  useEffect(() => {
    const list: Particle[] = [];
    const count = config.flowerCount;
    const speed = config.flowerSpeed;
    
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        x: Math.random() * 540,
        y: Math.random() * -960,
        size: 10 + Math.random() * 14,
        speedY: (1.5 + Math.random() * 2) * (speed / 10),
        speedX: (-0.6 + Math.random() * 1.2) * (speed / 10),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: -0.02 + Math.random() * 0.04,
      });
    }
    particlesRef.current = list;

    // Seed beautiful romantic pink and reddish hearts
    const heartList: HeartParticle[] = [];
    const heartColors = ["#fb7185", "#f43f5e", "#e11d48", "#ff4d6d", "#ff758f", "#ef4444"];
    for (let i = 0; i < count; i++) {
      heartList.push({
        id: i,
        x: Math.random() * 540,
        y: Math.random() * -960,
        size: 6 + Math.random() * 8, // Small hearts range
        speedY: (1.2 + Math.random() * 1.8) * (speed / 10),
        speedX: (-0.5 + Math.random() * 1.0) * (speed / 10),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: -0.03 + Math.random() * 0.06,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
      });
    }
    heartsRef.current = heartList;
  }, [config.flowerCount, config.flowerSpeed]);

  // Mark render needed when config changes
  useEffect(() => {
    needsRenderRef.current = true;
  }, [config]);

  // Synchronize dynamic player state to our local loops
  useEffect(() => {
    isPlayingRef.current = isPlaying;

    const introVideo = introAudioEl.current || introVideoEl.current || null;
    const mainVideo = mainVideoEl.current;
    const outroVideo = outroVideoEl.current;

    // Apply audio mixer volume dynamically to active decoders
    if (introVideo && config.introVideo.url) introVideo.volume = config.audioMixVolume;
    if (mainVideo && config.mainVideo.url) mainVideo.volume = config.audioMixVolume;
    if (outroVideo && config.outroVideo.url) outroVideo.volume = config.audioMixVolume;

    if (!isPlaying) {
      if (introVideo && config.introVideo.url) { try { introVideo.pause(); } catch(e) {} }
      if (mainVideo && config.mainVideo.url) { try { mainVideo.pause(); } catch(e) {} }
      if (outroVideo && config.outroVideo.url) { try { outroVideo.pause(); } catch(e) {} }
    }
  }, [isPlaying, config.audioMixVolume, config.introVideo.url, config.mainVideo.url, config.outroVideo.url]);

  // Direct precise seek operations for static previews or pauses
  const seekVideosToTime = (targetTime: number) => {
    const introVideo = introAudioEl.current || introVideoEl.current || null;
    const mainVideo = mainVideoEl.current;
    const outroVideo = outroVideoEl.current;

    if (introVideo && mainVideo && outroVideo) {
      if (targetTime < INTRO_DURATION) {
        if (config.introVideo.url) {
          try { introVideo.currentTime = Math.min(introVideo.duration || INTRO_DURATION, targetTime); } catch(e) {}
        }
        if (config.mainVideo.url) { try { mainVideo.currentTime = 0; } catch(e) {} }
        if (config.outroVideo.url) { try { outroVideo.currentTime = 0; } catch(e) {} }
      } else if (targetTime < INTRO_DURATION + mainDuration) {
        if (config.introVideo.url) {
          try { introVideo.currentTime = introVideo.duration || INTRO_DURATION; } catch(e) {}
        }
        if (config.mainVideo.url) {
          try { mainVideo.currentTime = Math.min(mainVideo.duration || mainDuration, targetTime - INTRO_DURATION); } catch(e) {}
        }
        if (config.outroVideo.url) { try { outroVideo.currentTime = 0; } catch(e) {} }
      } else {
        if (config.introVideo.url) {
          try { introVideo.currentTime = introVideo.duration || INTRO_DURATION; } catch(e) {}
        }
        if (config.mainVideo.url) {
          try { mainVideo.currentTime = mainVideo.duration || mainDuration; } catch(e) {}
        }
        const oTime = targetTime - (INTRO_DURATION + mainDuration);
        if (config.outroVideo.url) {
          try { outroVideo.currentTime = Math.min(outroVideo.duration || OUTRO_DURATION, oTime); } catch(e) {}
        }
      }
    }
  };

  // High FPS 60 loop drawing onto HTML5 Canvas
  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      
      if (canvas && ctx) {
        // Optimization: Skip rendering if we are paused and don't have update requests
        if (!isPlayingRef.current && !needsRenderRef.current) {
          frameId = requestAnimationFrame(render);
          return;
        }

        needsRenderRef.current = false;

        const introVideo = introAudioEl.current || introVideoEl.current || null;
        const mainVideo = mainVideoEl.current;
        const outroVideo = outroVideoEl.current;

        // Master playhead update (exactly once) using linear smooth delta increments OR media-driven lock
        if (isPlayingRef.current) {
          let updatedFromMedia = false;
          const currentVal = playheadRef.current;

          if (currentVal < INTRO_DURATION) {
            if (introVideo && config.introVideo.url && !introVideo.paused && introVideo.readyState >= 2) {
              playheadRef.current = introVideo.currentTime;
              updatedFromMedia = true;
            }
          } else if (currentVal < INTRO_DURATION + mainDuration) {
            if (mainVideo && config.mainVideo.url && !mainVideo.paused && mainVideo.readyState >= 2) {
              playheadRef.current = INTRO_DURATION + mainVideo.currentTime;
              updatedFromMedia = true;
            }
          } else {
            if (outroVideo && config.outroVideo.url && !outroVideo.paused && outroVideo.readyState >= 2) {
              playheadRef.current = INTRO_DURATION + mainDuration + outroVideo.currentTime;
              updatedFromMedia = true;
            }
          }

          if (!updatedFromMedia) {
            playheadRef.current += delta;
          }
        }

        const currentVal = playheadRef.current;
        let currentPhase: "intro" | "wipe" | "main" | "outro" = "intro";
        let phaseTime = 0;

        if (currentVal < INTRO_DURATION) {
          currentPhase = "intro";
          phaseTime = currentVal;
        } else if (currentVal < INTRO_DURATION + mainDuration) {
          const mTime = currentVal - INTRO_DURATION;
          if (mTime < TRANSITION_DURATION) {
            currentPhase = "wipe";
            phaseTime = mTime;
          } else {
            currentPhase = "main";
            phaseTime = mTime;
          }
        } else {
          currentPhase = "outro";
          phaseTime = Math.min(OUTRO_DURATION, currentVal - (INTRO_DURATION + mainDuration));
        }

        const isPhaseChanged = currentPhase !== lastPhaseRef.current;
        if (isPhaseChanged) {
          lastPhaseRef.current = currentPhase;
        }

        const CROSSFADE_DURATION = 0.5;
        const mainEndTime = INTRO_DURATION + mainDuration;
        const inCrossfadeToOutro = currentVal >= mainEndTime - CROSSFADE_DURATION && currentVal < mainEndTime;

        // Active playing video synchronization done elegantly without continuous seeking!
        if (isPlayingRef.current) {
          if (currentPhase === "intro") {
            if (introVideo && config.introVideo.url) {
              if (introVideo.paused) introVideo.play().catch(() => {});
              introVideo.muted = false;
              const targetSeek = Math.min(introVideo.duration || INTRO_DURATION, phaseTime);
              if (isPhaseChanged || Math.abs(introVideo.currentTime - targetSeek) > 1.5) {
                introVideo.currentTime = targetSeek;
              }
            }
            if (mainVideo && config.mainVideo.url && !mainVideo.paused) { mainVideo.pause(); mainVideo.muted = true; }
            if (outroVideo && config.outroVideo.url && !outroVideo.paused) { outroVideo.pause(); outroVideo.muted = true; }
          } 
          else if (currentPhase === "wipe") {
            if (introVideo && config.introVideo.url && !introVideo.paused) { introVideo.pause(); introVideo.muted = true; }
            if (mainVideo && config.mainVideo.url) {
              if (mainVideo.paused) mainVideo.play().catch(() => {});
              mainVideo.muted = true;
              const targetSeek = phaseTime;
              if (isPhaseChanged || Math.abs(mainVideo.currentTime - targetSeek) > 1.5) {
                mainVideo.currentTime = targetSeek;
              }
            }
            if (outroVideo && config.outroVideo.url && !outroVideo.paused) { outroVideo.pause(); outroVideo.muted = true; }
          } 
          else if (currentPhase === "main") {
            if (introVideo && config.introVideo.url && !introVideo.paused) { introVideo.pause(); introVideo.muted = true; }
            if (mainVideo && config.mainVideo.url) {
              if (mainVideo.paused) mainVideo.play().catch(() => {});
              mainVideo.muted = false;
              const targetSeek = phaseTime;
              if (isPhaseChanged || Math.abs(mainVideo.currentTime - targetSeek) > 1.5) {
                mainVideo.currentTime = targetSeek;
              }

              // Audio fade out for main video
              if (inCrossfadeToOutro) {
                const fadeProgress = (currentVal - (mainEndTime - CROSSFADE_DURATION)) / CROSSFADE_DURATION;
                mainVideo.volume = config.audioMixVolume * (1 - fadeProgress);
              } else {
                mainVideo.volume = config.audioMixVolume;
              }
            }

            // Pre-start outro video for crossfade
            if (inCrossfadeToOutro && outroVideo && config.outroVideo.url) {
              if (outroVideo.paused) outroVideo.play().catch(() => {});
              outroVideo.muted = true; // Stay muted during visual crossfade background load
              outroVideo.currentTime = currentVal - mainEndTime + CROSSFADE_DURATION;
            } else if (!inCrossfadeToOutro && outroVideo && config.outroVideo.url && !outroVideo.paused) {
              outroVideo.pause();
            }
          } 
          else if (currentPhase === "outro") {
            if (introVideo && config.introVideo.url && !introVideo.paused) { introVideo.pause(); introVideo.muted = true; }
            if (mainVideo && config.mainVideo.url && !mainVideo.paused) { mainVideo.pause(); mainVideo.muted = true; }
            if (outroVideo && config.outroVideo.url) {
              if (outroVideo.paused) outroVideo.play().catch(() => {});
              outroVideo.muted = false;
              
              // Audio fade in for outro video
              const fadeDuration = 0.4;
              if (phaseTime < fadeDuration) {
                outroVideo.volume = config.audioMixVolume * (phaseTime / fadeDuration);
              } else {
                outroVideo.volume = config.audioMixVolume;
              }

              const targetSeek = Math.min(outroVideo.duration || OUTRO_DURATION, phaseTime);
              if (isPhaseChanged || Math.abs(outroVideo.currentTime - targetSeek) > 1.5) {
                outroVideo.currentTime = targetSeek;
              }
            }
          }

          // Cycle or stop playhead when it exceeds total duration
          if (playheadRef.current >= totalDuration) {
            playheadRef.current = totalDuration;
            setIsPlaying(false);
            isPlayingRef.current = false;
            
            if (introVideo) { introVideo.pause(); introVideo.muted = true; }
            if (mainVideo) { mainVideo.pause(); mainVideo.muted = true; }
            if (outroVideo) { outroVideo.pause(); outroVideo.muted = true; }
          }

          // Throttle React state update intervals to 10 FPS to bypass rendering bottleneck
          const frameIndex = Math.floor(time / 16.66);
          if (frameIndex % 6 === 0) {
            setTotalElapsedTime(playheadRef.current);
            setTimelinePercent((playheadRef.current / totalDuration) * 100);
            setPlaybackPhase(currentPhase);
          }
        }

        // Virtual dimensions for drawing calculations (540x960 layout space)
        const vWidth = 540;
        const vHeight = 960;

        ctx.save();

        // Turn on high-quality image smoothing for ultra sharp scaling of videos and assets
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Clear canvas base (fill entire 540x960 logical space)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, vWidth, vHeight);

        // Procedural Drawing fallback blocks
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

          const primaryText = "Who's today's princess? 👑";
          const secondaryText = "";

          // Display "Who's today's princess? 👑" for the first 2.2 seconds
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

          if (introCatImg.current) {
            const bob = Math.sin(timeSec * 30 * 0.15) * 8;
            const size = 320;
            const startX = width / 2 - size / 2;
            const startY = height - size + 40 + bob;
            c.drawImage(introCatImg.current, startX, startY, size, size);

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

            // Floating animated yellow question marks
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

          if (outroCatImg.current) {
            const bob = Math.sin(timeSec * 30 * 0.15) * 8;
            const size = 320;
            const startX = width / 2 - size / 2;
            const startY = height - size + 40 + bob;
            c.drawImage(outroCatImg.current, startX, startY, size, size);
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

          if (mainCatImg.current) {
            const bob = Math.sin(timeSec * 4.5) * 6;
            c.drawImage(mainCatImg.current, -70, h / 2 - 150 + bob, 140, 140);
          }
        };

        const drawIntroFrame = () => {
          // Visually ALWAYS draw the beautiful, elegant procedural cat intro (retaining the animated cat and thoughts),
          // while any uploaded intro video or audio track's sound/voice plays perfectly in the background!
          drawProceduralIntro(ctx, phaseTime, vWidth, vHeight);
        };

        const drawMainFrame = () => {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, vWidth, vHeight);

          // Render romantic sakura cherry blossoms in white background
          ctx.fillStyle = "#FDA4AF";
          const isPlayActive = isPlayingRef.current;
          particlesRef.current.forEach((p) => {
            if (isPlayActive) {
              p.y += p.speedY;
              p.x += p.speedX;
              p.rot += p.rotSpeed;

              if (p.y > vHeight + 20) {
                p.y = -20;
                p.x = Math.random() * vWidth;
              }
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            
            // Lightweight beautiful petal
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // petal core
            ctx.fillStyle = "#F43F5E";
            ctx.beginPath();
            ctx.ellipse(p.size * 0.15, 0, p.size * 0.22, p.size * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            ctx.fillStyle = "#FDA4AF";
          });

          // Render beautiful falling warm pink and reddish hearts
          heartsRef.current.forEach((h) => {
            if (isPlayActive) {
              h.y += h.speedY;
              h.x += h.speedX;
              h.rot += h.rotSpeed;

              if (h.y > vHeight + 20) {
                h.y = -20;
                h.x = Math.random() * vWidth;
              }
            }

            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.rotate(h.rot);
            
            ctx.fillStyle = h.color;
            ctx.beginPath();
            ctx.moveTo(0, -h.size * 0.2);
            ctx.bezierCurveTo(-h.size * 0.5, -h.size * 0.7, -h.size, -h.size * 0.15, 0, h.size * 0.75);
            ctx.bezierCurveTo(h.size, -h.size * 0.15, h.size * 0.5, -h.size * 0.7, 0, -h.size * 0.2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          });

          // Draw tilted main video frame leaning / swinging like a pendulum
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

          // Zero-overhead flat deep shadow (looks exceptionally clean & modern, 100% lag-free)
          ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
          ctx.beginPath();
          ctx.roundRect(-218 + 10, -376 + 12, 436, 752, [16]);
          ctx.fill();
          
          ctx.fillStyle = "#E4E4E7";
          ctx.beginPath();
          ctx.roundRect(-218, -376, 436, 752, [16]);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(-211, -370, 422, 740, [12]);
          ctx.fill();

          if (mainVideoEl.current && config.mainVideo.url) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(-201, -359, 402, 718, [8]);
            ctx.clip();

            // Draw current active original source video in full crisp resolution!
            ctx.drawImage(mainVideoEl.current, -201, -359, 402, 718);
            ctx.restore();
          } else {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(-201, -359, 402, 718, [8]);
            ctx.clip();

            drawProceduralMain(ctx, phaseTime, 402, 718);
            ctx.restore();
          }

          // Draw the minimal Instagram ID in matching swing pendulum motion
          if (config.instagramId) {
            const trimmed = config.instagramId.trim();
            if (trimmed) {
              const displayId = "@" + trimmed;
              ctx.save();
              ctx.fillStyle = "#1e293b"; // Rich ultra-dark slate-800
              ctx.font = "bold 32px 'JetBrains Mono', monospace";
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              
              // Clean high-contrast drop shadow for maximum outdoor/indoor legibility
              ctx.shadowColor = "rgba(255, 255, 255, 1.0)";
              ctx.shadowBlur = 6;
              
              // Rendered closer to the card border
              ctx.fillText(displayId, 0, -382);
              ctx.restore();
            }
          }

          ctx.restore();

          // Smooth reaction pop decoders with transitions pop-up after intro & shrink before outro
          const halfway = mainDuration / 2;
          const activeReaction = phaseTime < halfway ? "reaction1" : "reaction2";

          // Calculate a combined elastic scale that fades down smoothly before the outro starts
          let baseScale = 1.0;
          const introFadeDuration = 0.6;
          const outroFadeDuration = 0.6;

          if (phaseTime < introFadeDuration) {
            const t = phaseTime / introFadeDuration;
            // Elastic pop-in transition
            baseScale = Math.sin(t * Math.PI * 0.5) * 1.15 - 0.15 * (1 - t) * (1 - t);
          } else if (phaseTime > mainDuration - outroFadeDuration) {
            const timeLeft = mainDuration - phaseTime;
            const t = Math.max(0, timeLeft / outroFadeDuration);
            baseScale = t * t; // Smoothly slide/scale out before outro
          }

          // Cat reaction individual switch animation
          if (activeReaction !== lastActiveReactionRef.current) {
            reactionScaleRef.current = 0.5;
            lastActiveReactionRef.current = activeReaction;
          }

          if (reactionScaleRef.current < 1.0) {
            reactionScaleRef.current += (1.0 - reactionScaleRef.current) * 0.22;
          }

          const combinedScale = baseScale * reactionScaleRef.current;

          const targetImg = activeReaction === "reaction1" ? reaction1Img.current : reaction2Img.current;
          if (targetImg && combinedScale > 0.001) {
            ctx.save();
            const size = 207;
            const px = 270 - size / 2;
            const py = 760;

            // Zero-overhead high-precision flat dropshadow (looks beautiful and clean)
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
            const reactionUrl = activeReaction === "reaction1" ? config.reaction1.url : config.reaction2.url;
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
          if (outroVideoEl.current && config.outroVideo.url) {
            ctx.drawImage(outroVideoEl.current, 0, 0, vWidth, vHeight);
          } else {
            drawProceduralOutro(ctx, phaseTime, vWidth, vHeight);
          }
        };

        // Switch layouts cleanly using virtual dimensions
        if (currentPhase === "intro") {
          drawIntroFrame();
        } 
        else if (currentPhase === "wipe") {
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
        } 
        else if (currentPhase === "main") {
          if (inCrossfadeToOutro) {
            const p = (currentVal - (mainEndTime - CROSSFADE_DURATION)) / CROSSFADE_DURATION;
            drawMainFrame();
            ctx.save();
            ctx.globalAlpha = p;
            drawOutroFrame();
            ctx.restore();
          } else {
            drawMainFrame();
          }
        } 
        else if (currentPhase === "outro") {
          drawOutroFrame();
        }

        ctx.restore();
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [mainDuration, totalDuration, config]);

  // Handle immediate scrubber actions
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetTime = (val / 100) * totalDuration;
    
    playheadRef.current = targetTime;
    setTotalElapsedTime(targetTime);
    setTimelinePercent(val);
    
    if (targetTime < INTRO_DURATION) {
      setPlaybackPhase("intro");
    } else if (targetTime < INTRO_DURATION + TRANSITION_DURATION) {
      setPlaybackPhase("wipe");
    } else if (targetTime < INTRO_DURATION + TRANSITION_DURATION + mainDuration) {
      setPlaybackPhase("main");
    } else {
      setPlaybackPhase("outro");
    }

    seekVideosToTime(targetTime);
    needsRenderRef.current = true;
  };

  const handleStartPlay = () => {
    needsRenderRef.current = true;
    if (isPlayingRef.current) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      
      introVideoEl.current?.pause();
      introAudioEl.current?.pause();
      mainVideoEl.current?.pause();
      outroVideoEl.current?.pause();
    } else {
      if (playheadRef.current >= totalDuration - 0.05) {
        playheadRef.current = 0;
        seekVideosToTime(0);
      }

      // Explicitly prime and play media files inside click gesture block to prevent browser autoplay blocks!
      const introVideo = introAudioEl.current || introVideoEl.current || null;
      const mainVideo = mainVideoEl.current;
      const outroVideo = outroVideoEl.current;

      if (introVideo && config.introVideo.url) {
        introVideo.muted = false;
        introVideo.volume = config.audioMixVolume;
        if (playheadRef.current < INTRO_DURATION) {
          introVideo.play().catch((e) => console.warn("Primary click intro sound trigger active:", e));
        }
      }
      if (mainVideo && config.mainVideo.url) {
        mainVideo.volume = config.audioMixVolume;
        if (playheadRef.current >= INTRO_DURATION && playheadRef.current < INTRO_DURATION + mainDuration) {
          mainVideo.muted = false;
          mainVideo.play().catch((e) => console.warn("Primary click main trigger active:", e));
        }
      }
      if (outroVideo && config.outroVideo.url) {
        outroVideo.volume = config.audioMixVolume;
        if (playheadRef.current >= INTRO_DURATION + mainDuration) {
          outroVideo.muted = false;
          outroVideo.play().catch((e) => console.warn("Primary click outro trigger active:", e));
        }
      }

      setIsPlaying(true);
      isPlayingRef.current = true;
    }
  };

  const handleRestart = () => {
    playheadRef.current = 0;
    seekVideosToTime(0);
    setTotalElapsedTime(0);
    setTimelinePercent(0);
    setPlaybackPhase("intro");

    // Explicitly play and unmute intro inside click handler
    const introVideo = introAudioEl.current || introVideoEl.current || null;
    if (introVideo && config.introVideo.url) {
      introVideo.muted = false;
      introVideo.volume = config.audioMixVolume;
      introVideo.play().catch((e) => console.warn("Intro restart click trigger active:", e));
    }

    setIsPlaying(true);
    isPlayingRef.current = true;
  };

  return (
    <div className="flex flex-col items-center justify-center bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden" id="centered-player-wrapper">
      {/* Background radial ambiance */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[340px] flex flex-col justify-center">
        {/* Sleek smartphone mockup case */}
        <div className="relative mx-auto rounded-[36px] border-[10px] border-slate-900 bg-black p-1 shadow-2xl overflow-hidden aspect-[9/16] w-full max-w-[320px]">
          {/* Smartphone camera punch-hole lens */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          </div>

          {/* High refresh live canvas frame compositor */}
          <div className="w-full h-full rounded-[24px] overflow-hidden bg-white relative">
            <canvas
              ref={canvasRef}
              width={540}
              height={960}
              className="w-full h-full object-cover select-none"
            />

            {/* Seamless floating overlay indicators */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
              <span className="bg-black/50 backdrop-blur-md text-[10px] text-white px-3 py-1 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                {playbackPhase} Phase
              </span>
              <span className="bg-black/50 backdrop-blur-md text-[10px] text-white/95 px-2.5 py-0.5 rounded-md font-mono tracking-wider">
                {Math.floor(totalElapsedTime / 60)}:
                {String(Math.floor(totalElapsedTime % 60)).padStart(2, "0")}.
                {String(Math.floor((totalElapsedTime % 1) * 10)).padStart(1, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Clean, minimalist media chassis controls deck */}
        <div className="mt-5 space-y-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl">
          {/* Pro timeline seek progress bar */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={timelinePercent}
              onChange={handleScrub}
              className="w-full accent-pink-500 bg-slate-850 h-1.5 rounded-lg outline-none cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0:00</span>
              <span>
                {Math.floor(totalDuration / 60)}:
                {String(Math.floor(totalDuration % 60)).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Interaction knobs */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleRestart}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Restart"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              onClick={handleStartPlay}
              className="p-3.5 bg-pink-600 hover:bg-pink-700 text-white rounded-full transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-pink-500/20"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="translate-x-0.5" />}
            </button>

            <div className="flex items-center gap-2 bg-slate-850/40 px-2.5 py-1 rounded-md text-[10px] text-slate-400 font-semibold tracking-wider uppercase border border-slate-800/30">
              <Volume2 size={13} className="text-pink-400 shrink-0" />
              <span>Original Audio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
