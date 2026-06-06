/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// SVG definitions for default assets (Cutest anime cat cartoon as described by the images)
export const COOL_CAT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <!-- Clean light background -->
  <circle cx="200" cy="200" r="190" fill="#FFFFFF" stroke="#F1F5F9" stroke-width="6"/>
  
  <!-- Floating Sparkle/Star on the left -->
  <path d="M55,150 Q75,150 75,130 Q75,150 95,150 Q75,150 75,170 Q75,150 55,150 Z" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>

  <!-- Cat Body / Black Hoodie -->
  <path d="M80,380 C80,310 120,250 200,250 C280,250 320,310 320,380 Z" fill="#111827" stroke="#030712" stroke-width="8"/>
  <path d="M150,255 C150,255 175,305 200,305 C225,305 250,255 250,255 Z" fill="#1F2937" stroke="#030712" stroke-width="5"/>

  <!-- Thick Gold Chain Necklace -->
  <path d="M140,270 C160,310 240,310 260,270" fill="none" stroke="#D97706" stroke-width="14" stroke-linecap="round"/>
  <path d="M140,270 C160,310 240,310 260,270" fill="none" stroke="#F59E0B" stroke-width="10" stroke-linecap="round"/>
  <path d="M140,270 C160,310 240,310 260,270" fill="none" stroke="#FEF08A" stroke-width="4" stroke-dasharray="10,8" stroke-linecap="round"/>

  <!-- Head (Charcoal Grey Fur) -->
  <path d="M105,235 C95,160 110,120 200,120 C290,120 305,160 295,235 C295,275 275,285 200,285 C125,285 105,275 105,235 Z" fill="#374151" stroke="#111827" stroke-width="8"/>

  <!-- Ears & Inner Pinkish Lining -->
  <!-- Left Ear -->
  <path d="M120,130 L80,45 C80,45 110,55 145,100" fill="#374151" stroke="#111827" stroke-width="8" stroke-linejoin="round"/>
  <path d="M115,115 L90,60 C90,60 110,65 130,95" fill="#8B5A5A"/>
  
  <!-- Right Ear -->
  <path d="M280,130 L320,45 C320,45 290,55 255,100" fill="#374151" stroke="#111827" stroke-width="8" stroke-linejoin="round"/>
  <path d="M285,115 L310,60 C310,60 290,65 270,95" fill="#8B5A5A"/>

  <!-- Two Golden Earrings on Right Ear -->
  <circle cx="318" cy="72" r="10" fill="none" stroke="#F59E0B" stroke-width="5"/>
  <circle cx="310" cy="85" r="10" fill="none" stroke="#F59E0B" stroke-width="5"/>

  <!-- Cheek Tufts -->
  <path d="M105,190 L75,180 L107,210 L80,205 L110,230" fill="#374151" stroke="#111827" stroke-width="6"/>
  <path d="M295,190 L325,180 L293,210 L320,205 L290,230" fill="#374151" stroke="#111827" stroke-width="6"/>

  <!-- Expressive Thinking Eyebrows -->
  <path d="M135,145 Q160,135 170,148" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>
  <path d="M230,148 Q240,135 265,145" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>

  <!-- Beautiful Round Yellow Eyes (Looking Up & Left) -->
  <circle cx="155" cy="175" r="28" fill="#FBBF24" stroke="#111827" stroke-width="6"/>
  <circle cx="245" cy="175" r="28" fill="#FBBF24" stroke="#111827" stroke-width="6"/>
  <!-- Pupils shifted up and left -->
  <ellipse cx="150" cy="170" rx="15" ry="21" fill="#111827"/>
  <ellipse cx="240" cy="170" rx="15" ry="21" fill="#111827"/>
  <!-- Eye Highlights -->
  <circle cx="145" cy="162" r="7" fill="#FFFFFF"/>
  <circle cx="156" cy="178" r="3" fill="#FFFFFF"/>
  <circle cx="235" cy="162" r="7" fill="#FFFFFF"/>
  <circle cx="246" cy="178" r="3" fill="#FFFFFF"/>

  <!-- Snout -->
  <ellipse cx="200" cy="212" rx="22" ry="14" fill="#1F2937"/>
  <!-- Nose (Chocolate brown/pink) -->
  <polygon points="188,206 212,206 200,216" fill="#881337" stroke="#111827" stroke-width="3" stroke-linejoin="round"/>
  <!-- Whiskers Dots -->
  <circle cx="184" cy="218" r="1.5" fill="#111827"/>
  <circle cx="188" cy="222" r="1.5" fill="#111827"/>
  <circle cx="178" cy="222" r="1.5" fill="#111827"/>
  <circle cx="216" cy="218" r="1.5" fill="#111827"/>
  <circle cx="212" cy="222" r="1.5" fill="#111827"/>
  <circle cx="222" cy="222" r="1.5" fill="#111827"/>

  <!-- Curious Smirk Mouth -->
  <path d="M185,222 C192,230 200,224 200,222 C200,224 208,230 215,222" fill="none" stroke="#111827" stroke-width="4.5" stroke-linecap="round"/>

  <!-- Long Whiskers -->
  <path d="M85,210 L30,220" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
  <path d="M85,225 L25,245" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
  <path d="M85,238 L35,268" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
  <path d="M315,210 L370,220" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
  <path d="M315,225 L375,245" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
  <path d="M315,238 L365,268" stroke="#111827" stroke-width="3" stroke-linecap="round"/>

  <!-- Black Sunglasses resting on head -->
  <g transform="translate(0, -10)">
    <path d="M120,110 L280,110" stroke="#111827" stroke-width="12" stroke-linecap="round"/>
    <!-- Left lens -->
    <path d="M125,110 Q145,148 180,138 Q190,110 175,110 Z" fill="#111827" stroke="#1F2937" stroke-width="5" stroke-linejoin="round"/>
    <path d="M135,116 L152,126" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
    <!-- Right lens -->
    <path d="M220,110 Q210,110 220,138 Q255,148 275,110 Z" fill="#111827" stroke="#1F2937" stroke-width="5" stroke-linejoin="round"/>
    <path d="M242,116 L259,126" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  </g>

  <!-- Thinking Hand (Paw on Chin) -->
  <g transform="translate(15, 10)">
    <path d="M100,380 C100,320 120,270 145,245 C155,235 170,240 162,258 C155,275 145,290 142,340" fill="#374151" stroke="#111827" stroke-width="8" stroke-linejoin="round"/>
    <!-- Fingers curled near mouth -->
    <circle cx="152" cy="242" r="8" fill="#374151" stroke="#111827" stroke-width="5"/>
    <circle cx="163" cy="247" r="8" fill="#374151" stroke="#111827" stroke-width="5"/>
    <circle cx="170" cy="258" r="8" fill="#374151" stroke="#111827" stroke-width="5"/>
  </g>
</svg>
`;

export const SURPRISED_CAT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <circle cx="200" cy="200" r="190" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="6"/>
  
  <!-- Hoodie and Body -->
  <path d="M100,380 C100,310 130,260 200,260 C270,260 300,310 300,380" fill="#1E293B" stroke="#0F172A" stroke-width="8"/>
  <path d="M160,265 C160,265 180,315 200,315 C220,315 240,265 240,265" fill="#475569" stroke="#0F172A" stroke-width="6"/>

  <!-- Gold Chain -->
  <path d="M135,285 C155,335 245,335 265,285" fill="none" stroke="#F59E0B" stroke-width="12" stroke-linecap="round"/>
  <path d="M135,285 C155,335 245,335 265,285" fill="none" stroke="#FEF08A" stroke-width="4" stroke-dasharray="10,8" stroke-linecap="round"/>

  <!-- Head -->
  <path d="M110,250 C100,180 110,130 200,130 C290,130 300,180 290,250 C290,290 270,300 200,300 C130,300 110,290 110,250 Z" fill="#475569" stroke="#0F172A" stroke-width="8"/>

  <!-- Ears -->
  <path d="M120,140 L75,55 C75,55 105,65 140,110" fill="#475569" stroke="#0F172A" stroke-width="8" stroke-linejoin="round"/>
  <path d="M115,120 L85,68 C85,68 105,75 125,103" fill="#FDA4AF"/>
  <path d="M280,140 L325,55 C325,55 295,65 260,110" fill="#475569" stroke="#0F172A" stroke-width="8" stroke-linejoin="round"/>
  <path d="M285,120 L315,68 C315,68 295,75 275,103" fill="#FDA4AF"/>

  <!-- Cheeks fluff (Wilder look) -->
  <path d="M110,195 L72,185 L108,215 L78,212 L112,240" fill="#475569" stroke="#0F172A" stroke-width="6"/>
  <path d="M290,195 L328,185 L292,215 L322,212 L288,240" fill="#475569" stroke="#0F172A" stroke-width="6"/>

  <!-- Surprised Big Eyes -->
  <circle cx="155" cy="175" r="36" fill="#F59E0B" stroke="#0F172A" stroke-width="7"/>
  <circle cx="245" cy="175" r="36" fill="#F59E0B" stroke="#0F172A" stroke-width="7"/>
  <!-- Dilated Pupils (Shaking look) -->
  <circle cx="155" cy="175" r="14" fill="#0F172A"/>
  <circle cx="245" cy="175" r="14" fill="#0F172A"/>
  <circle cx="149" cy="168" r="6" fill="#FFFFFF"/>
  <circle cx="239" cy="168" r="6" fill="#FFFFFF"/>

  <!-- Drop Gaping Mouth -->
  <!-- Snout -->
  <ellipse cx="200" cy="210" rx="15" ry="9" fill="#334155"/>
  <polygon points="192,205 208,205 200,213" fill="#E11D48"/>
  
  <!-- Big Surprised Agast Mouth -->
  <path d="M175,230 Q200,275 225,230 Z" fill="#450A0A" stroke="#0F172A" stroke-width="6" stroke-linejoin="round"/>
  <!-- Cute little tongue -->
  <path d="M185,250 C185,250 200,265 215,250 C215,250 200,270 185,250" fill="#FB7185"/>

  <!-- Sunglasses resting high up -->
  <path d="M125,100 L275,100" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
  <path d="M130,100 Q150,135 180,125 Q190,100 175,100 Z" fill="#1E293B" stroke="#0F172A" stroke-width="6"/>
  <path d="M220,100 Q210,100 220,125 Q250,135 270,100 Z" fill="#1E293B" stroke="#0F172A" stroke-width="6"/>

  <!-- Exclamation Marks lines -->
  <path d="M60,120 L30,110" stroke="#0F172A" stroke-width="6" stroke-linecap="round"/>
  <path d="M55,150 L25,155" stroke="#0F172A" stroke-width="6" stroke-linecap="round"/>
  <path d="M65,180 L35,195" stroke="#0F172A" stroke-width="6" stroke-linecap="round"/>
</svg>
`;

export const SHOCKED_CAT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <circle cx="200" cy="200" r="190" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="6"/>
  
  <!-- Hoodie & Body -->
  <path d="M100,380 C100,310 130,260 200,260 C270,260 300,310 300,380" fill="#1E293B" stroke="#0F172A" stroke-width="8"/>
  <path d="M160,265 C160,265 180,315 200,315 C220,315 240,265 240,265" fill="#475569" stroke="#0F172A" stroke-width="6"/>

  <!-- Head -->
  <path d="M110,250 C100,180 110,130 200,130 C290,130 300,180 290,250 C290,290 270,300 200,300 C130,300 110,290 110,250 Z" fill="#475569" stroke="#0F172A" stroke-width="8"/>

  <!-- Ears (Pinned slightly sideways for shock) -->
  <path d="M118,140 L65,70 C65,70 95,75 135,115" fill="#475569" stroke="#0F172A" stroke-width="8" stroke-linejoin="round"/>
  <path d="M112,122 L75,80 C75,80 95,85 120,110" fill="#FDA4AF"/>
  <path d="M282,140 L335,70 C335,70 305,75 265,115" fill="#475569" stroke="#0F172A" stroke-width="8" stroke-linejoin="round"/>
  <path d="M288,122 L325,80 C325,80 305,85 280,110" fill="#FDA4AF"/>

  <!-- Totally Shocked Huge Eyes -->
  <circle cx="150" cy="175" r="40" fill="#F59E0B" stroke="#0F172A" stroke-width="8"/>
  <circle cx="250" cy="175" r="40" fill="#F59E0B" stroke="#0F172A" stroke-width="8"/>
  <!-- Microscopic Pupils for pure shock -->
  <circle cx="150" cy="175" r="6" fill="#0F172A"/>
  <circle cx="250" cy="175" r="6" fill="#0F172A"/>
  <!-- Extreme Ring sweat drops / anime lines -->
  <circle cx="150" cy="175" r="28" fill="none" stroke="#EF4444" stroke-width="2" stroke-dasharray="4,4"/>
  <circle cx="250" cy="175" r="28" fill="none" stroke="#EF4444" stroke-width="2" stroke-dasharray="4,4"/>

  <!-- Huge Shocked Scream Mouth -->
  <ellipse cx="200" cy="235" rx="30" ry="38" fill="#450A0A" stroke="#0F172A" stroke-width="8"/>
  <!-- Tongue -->
  <path d="M180,250 C180,250 200,270 220,250 C220,268 180,268 180,250" fill="#F43F5E"/>

  <!-- Paws on cheeks (OMG Pose!) -->
  <!-- Left Paw -->
  <path d="M100,280 C90,240 120,195 135,210 C145,220 125,270 110,285" fill="#475569" stroke="#0F172A" stroke-width="8"/>
  <circle cx="125" cy="215" r="5" fill="#0F172A"/>
  <circle cx="115" cy="225" r="5" fill="#0F172A"/>
  <circle cx="110" cy="240" r="5" fill="#0F172A"/>
  <!-- Right Paw -->
  <path d="M300,280 C310,240 280,195 265,210 C255,220 275,270 290,285" fill="#475569" stroke="#0F172A" stroke-width="8"/>
  <circle cx="275" cy="215" r="5" fill="#0F172A"/>
  <circle cx="285" cy="225" r="5" fill="#0F172A"/>
  <circle cx="290" cy="240" r="5" fill="#0F172A"/>

  <!-- !! Exclamation Floating Marks -->
  <g transform="translate(320, 110) rotate(15)">
    <rect x="-10" y="-35" width="20" height="40" rx="5" fill="#EF4444" stroke="#0F172A" stroke-width="4"/>
    <circle cx="0" cy="20" r="11" fill="#EF4444" stroke="#0F172A" stroke-width="4"/>
  </g>
  <g transform="translate(355, 130) rotate(25)">
    <rect x="-8" y="-30" width="16" height="32" rx="4" fill="#EF4444" stroke="#0F172A" stroke-width="4"/>
    <circle cx="0" cy="15" r="9" fill="#EF4444" stroke="#0F172A" stroke-width="4"/>
  </g>
</svg>
`;

export const OUTRO_CAT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <circle cx="200" cy="200" r="190" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="6"/>

  <!-- Hoodie & Body -->
  <path d="M100,380 C100,320 130,260 200,260 C270,260 300,320 300,380" fill="#1E293B" stroke="#0F172A" stroke-width="8"/>
  <path d="M160,265 C160,265 180,310 200,310 C220,310 240,265 240,265" fill="#334155" stroke="#0F172A" stroke-width="6"/>

  <!-- Gold Chain -->
  <path d="M140,285 C160,330 240,330 260,285" fill="none" stroke="#F59E0B" stroke-width="12" stroke-linecap="round"/>
  <path d="M140,285 C160,330 240,330 260,285" fill="none" stroke="#FEF08A" stroke-width="4" stroke-dasharray="10,8" stroke-linecap="round"/>

  <!-- Head -->
  <path d="M110,250 C100,180 110,140 200,140 C290,140 300,180 290,250 C290,290 270,300 200,300 C130,300 110,290 110,250 Z" fill="#475569" stroke="#0F172A" stroke-width="8"/>

  <!-- Ears -->
  <path d="M120,150 L80,60 L145,115" fill="#475569" stroke="#0F172A" stroke-width="8" stroke-linejoin="round"/>
  <path d="M115,130 L90,75 L130,110" fill="#FDA4AF"/>
  <path d="M280,150 L320,60 L255,115" fill="#475569" stroke="#0F172A" stroke-width="8" stroke-linejoin="round"/>
  <path d="M285,130 L310,75 L270,110" fill="#FDA4AF"/>

  <!-- Eyes - Super happy closed smile eyes! -->
  <path d="M130,185 Q152,160 175,185" fill="none" stroke="#F59E0B" stroke-width="10" stroke-linecap="round"/>
  <path d="M130,185 Q152,160 175,185" fill="none" stroke="#0F172A" stroke-width="6" stroke-linecap="round"/>
  <path d="M225,185 Q248,160 270,185" fill="none" stroke="#F59E0B" stroke-width="10" stroke-linecap="round"/>
  <path d="M225,185 Q248,160 270,185" fill="none" stroke="#0F172A" stroke-width="6" stroke-linecap="round"/>

  <!-- Blushing Cheeks -->
  <ellipse cx="130" cy="205" rx="14" ry="8" fill="#F43F5E" opacity="0.6"/>
  <ellipse cx="270" cy="205" rx="14" ry="8" fill="#F43F5E" opacity="0.6"/>

  <!-- Nose & Happy Open Smile mouth with fang -->
  <ellipse cx="200" cy="215" rx="15" ry="9" fill="#334155"/>
  <polygon points="192,208 208,208 200,216" fill="#E11D48"/>
  <path d="M175,225 Q200,265 225,225 Z" fill="#991B1B" stroke="#0F172A" stroke-width="5" stroke-linejoin="round"/>
  <!-- Fang -->
  <polygon points="182,225 190,234 195,225" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>

  <!-- Sunglasses on Head -->
  <path d="M120,115 L280,115" stroke="#0F172A" stroke-width="12" stroke-linecap="round"/>
  <path d="M125,115 Q145,155 185,145 Q195,115 175,115 Z" fill="#1E293B" stroke="#0F172A" stroke-width="8" stroke-linejoin="round"/>
  <path d="M215,115 Q205,115 215,145 Q255,155 275,115 Z" fill="#1E293B" stroke="#0F172A" stroke-width="8" stroke-linejoin="round"/>

  <!-- Thumbs Up Hand (LHS/RHS) -->
  <g transform="translate(305, 290)">
    <!-- Hand base -->
    <path d="M-10,30 C5,30 25,10 25,-10 C25,-30 5,-35 -5,-35 C-15,-35 -18,-20 -15,-10" fill="#475569" stroke="#0F172A" stroke-width="6"/>
    <!-- Thumb sticking straight up -->
    <path d="M-12,-30 C-12,-55 5,-55 5,-30" fill="#475569" stroke="#0F172A" stroke-width="6" stroke-linejoin="round"/>
    <!-- Folded Fingers -->
    <rect x="-10" y="-15" width="25" height="10" rx="4" fill="#334155" stroke="#0F172A" stroke-width="4"/>
    <rect x="-10" y="-5" width="22" height="10" rx="4" fill="#334155" stroke="#0F172A" stroke-width="4"/>
    <rect x="-10" y="5" width="20" height="10" rx="4" fill="#334155" stroke="#0F172A" stroke-width="4"/>
  </g>
</svg>
`;

// Helper to convert SVG markup into a data URL
export function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

export const DEFAULT_COOL_CAT_URL = svgToDataUrl(COOL_CAT_SVG);
export const DEFAULT_SURPRISED_CAT_URL = svgToDataUrl(SURPRISED_CAT_SVG);
export const DEFAULT_SHOCKED_CAT_URL = svgToDataUrl(SHOCKED_CAT_SVG);
export const DEFAULT_OUTRO_CAT_URL = svgToDataUrl(OUTRO_CAT_SVG);

/**
 * Programmatically generates a highly polished webm/mp4 video from canvas capture to act as high quality defaults!
 * This avoids CORS/internet issues and runs 100% offline.
 */
export async function generateDefaultVideoFile(
  type: "intro" | "outro" | "main",
  durationSec: number = 4
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 540;
  canvas.height = 960;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas 2D context");

  const videoStream = canvas.captureStream(30); // 30 FPS
  
  // Construct a synthetic AudioTrack using Web Audio API so the generated video has valid unmuted physical audio channels!
  let audioTrack: MediaStreamTrack | null = null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    try {
      const audioCtx = new AudioContextClass();
      const dest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      if (type === "intro") {
        // Melodic rising arpeggio (C4 to E4 to G4 to C5) to feel enthusiastic
        osc.type = "sine";
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.setValueAtTime(329.63, now + 0.3); // E4
        osc.frequency.setValueAtTime(392.00, now + 0.6); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.9); // C5
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec - 0.2);
      } else if (type === "outro") {
        // Sweet bell-like chime descending pattern for wrapping up
        osc.type = "triangle";
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(440.00, now + 0.4); // A4
        osc.frequency.setValueAtTime(349.23, now + 0.8); // F4
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec - 0.2);
      } else {
        // Soft rhythmic background heartbeat to mock real microphone environment
        osc.type = "sine";
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(65.41, now); // Low C2 hum
        for (let t = 0; t < durationSec; t += 1.0) {
          gainNode.gain.setValueAtTime(0.07, now + t);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + t + 0.45);
        }
      }

      osc.connect(gainNode);
      gainNode.connect(dest);
      osc.start(0);
      osc.stop(durationSec);

      audioTrack = dest.stream.getAudioTracks()[0] || null;
    } catch (e) {
      console.warn("Could not generate synthetic preview audio tracks:", e);
    }
  }

  // Combine video stream and audio track
  const combinedStream = new MediaStream();
  combinedStream.addTrack(videoStream.getVideoTracks()[0]);
  if (audioTrack) {
    combinedStream.addTrack(audioTrack);
  } else {
    console.warn("No audio track was synthesized. Video will be mute.");
  }

  // Choose supported media recorder options (now with audio + video support)
  let options = { mimeType: "video/webm;codecs=vp9,opus" };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm;codecs=vp8,opus" };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm" };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "" }; // default fallback
  }

  const mediaRecorder = new MediaRecorder(combinedStream, options);
  const chunks: Blob[] = [];

  const recordedPromise = new Promise<Blob>((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
    mediaRecorder.onerror = (err) => reject(err);
  });

  // Load the applicable SVG avatar image
  const avatarImg = new Image();
  let avatarLoaded = false;
  avatarImg.onload = () => {
    avatarLoaded = true;
  };
  
  if (type === "intro") {
    avatarImg.src = DEFAULT_COOL_CAT_URL;
  } else if (type === "outro") {
    avatarImg.src = DEFAULT_OUTRO_CAT_URL;
  } else {
    // For main fallback, we use surprise
    avatarImg.src = DEFAULT_SURPRISED_CAT_URL;
  }

  // Set up animation
  const totalFrames = durationSec * 30;
  let currentFrame = 0;
  mediaRecorder.start();

  return new Promise<File>((resolve, reject) => {
    const drawFrame = () => {
      if (currentFrame >= totalFrames) {
        mediaRecorder.stop();
        recordedPromise
          .then((blob) => {
            const file = new File([blob], `${type}_default.webm`, { type: "video/webm" });
            resolve(file);
          })
          .catch(reject);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      if (type === "intro") {
        ctx.fillStyle = "#82a1bc"; // Beautiful soothing light sky-blue background matching 1.mp4
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtitle Text exactly matching 1.mp4 audio query structure
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 8;
        ctx.lineJoin = "round";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const currentSec = currentFrame / 30;
        const primaryText = "Aaj ki princess kaun hai ?";
        const secondaryText = "";

        // Display "Aaj ki princess kaun hai ?" for the first 2.2 seconds
        const activeText = currentSec < 2.2 ? primaryText : secondaryText;

        if (activeText) {
          const cx = canvas.width / 2;
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
          ctx.save();
          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = "#0F172A";
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

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
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();

          // Stroke and fill lobes (this outlines the outer bounds with puffy cloud shapes)
          lobes.forEach(l => {
            const lx = cx + Math.cos(l.angle) * rx;
            const ly = cy + Math.sin(l.angle) * ry;
            ctx.beginPath();
            ctx.arc(lx, ly, l.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

          // Mask inner stroke overlaps for flawless presentation
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, Math.PI * 2);
          ctx.fill();

          lobes.forEach(l => {
            const lx = cx + Math.cos(l.angle) * rx;
            const ly = cy + Math.sin(l.angle) * ry;
            ctx.beginPath();
            ctx.arc(lx, ly, l.r - 2, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.restore();

          // Draw 3 tiny clouds of decreasing size heading towards the cat
          drawSmallFluffyCloud(ctx, cx - 15, cy + ry + 25, 18);
          drawSmallFluffyCloud(ctx, cx - 40, cy + ry + 65, 12);
          drawSmallFluffyCloud(ctx, cx - 60, cy + ry + 100, 7);

          // Write text inside the bubble
          ctx.save();
          ctx.fillStyle = "#0F172A";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "bold 26px 'Space Grotesk', 'Inter', Arial, sans-serif";
          ctx.fillText(activeText, cx, cy);
          ctx.restore();
        }

        // Floating ambient white sparkles
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        for (let i = 0; i < 10; i++) {
          const shiftY = ((currentFrame * 1.5 + i * 100) % canvas.height);
          const shiftX = (Math.sin(currentFrame * 0.03 + i) * 30 + (i * 60)) % canvas.width;
          ctx.beginPath();
          ctx.arc(shiftX, shiftY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === "outro") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Falling confetti
        for (let i = 0; i < 20; i++) {
          const color = ["#FB7185", "#38BDF8", "#34D399", "#FBBF24", "#C084FC"][i % 5];
          ctx.fillStyle = color;
          const shiftY = ((currentFrame * 3 + i * 110) % canvas.height);
          const shiftX = (Math.sin(currentFrame * 0.04 + i) * 40 + (i * 35)) % canvas.width;
          ctx.fillRect(shiftX, shiftY, 8, 12);
        }

        ctx.fillStyle = "#000000";
        ctx.font = "bold 34px 'Space Grotesk', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("That it for Today", canvas.width / 2, 160);

        ctx.font = "500 28px 'Inter', Arial, sans-serif";
        ctx.fillStyle = "#4B5563";
        ctx.fillText("See you Tomorrow", canvas.width / 2, 230);
      } else {
        // Main video fallback (spinning color circle and gradient shapes)
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#F43F5E");
        gradient.addColorStop(0.5, "#EC4899");
        gradient.addColorStop(1, "#D946EF");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // A nice rotating model showcase container
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(currentFrame * 0.03);
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 30;
        ctx.fillRect(-120, -120, 240, 240);
        
        ctx.fillStyle = "#1E293B";
        ctx.font = "bold 18px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CAMERA REEL", 0, -20);
        ctx.font = "14px 'JetBrains Mono', monospace";
        ctx.fillText("00:" + String(Math.floor(currentFrame / 30)).padStart(2, "0"), 0, 20);
        ctx.restore();
      }

      // Draw avatar photo
      if (avatarLoaded) {
        // Make the avatar bob up and down happily
        const bob = Math.sin(currentFrame * 0.15) * 8;
        
        if (type === "intro" || type === "outro") {
          // Bottom center
          const size = 320;
          const startX = canvas.width / 2 - size / 2;
          const startY = canvas.height - size + 40 + bob;
          ctx.drawImage(
            avatarImg,
            startX,
            startY,
            size,
            size
          );

          // Add beautiful native animations on top of the base thinking cat image
          if (type === "intro") {
            // 1. Warm eye blinking every 3.5 seconds (lasts 8 frames, approx 0.25s)
            const isBlinking = (currentFrame % 105) < 8;
            if (isBlinking) {
              ctx.save();
              ctx.fillStyle = "#374151"; // Charcoal Grey Fur matching head exactly
              ctx.strokeStyle = "#111827"; // Dark contour outline
              ctx.lineWidth = 5;
              ctx.lineCap = "round";

              // Left eye eyelid
              const eyeL_X = startX + (155 * 0.8);
              const eyeL_Y = startY + (175 * 0.8) - 10; // offset slightly for sunglasses placement
              ctx.beginPath();
              ctx.arc(eyeL_X, eyeL_Y, 23, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.beginPath();
              ctx.arc(eyeL_X, eyeL_Y, 20, 0.15 * Math.PI, 0.85 * Math.PI);
              ctx.stroke();

              // Right eye eyelid
              const eyeR_X = startX + (245 * 0.8);
              const eyeR_Y = startY + (175 * 0.8) - 10;
              ctx.beginPath();
              ctx.arc(eyeR_X, eyeR_Y, 23, 0, Math.PI * 2);
              ctx.fill();

              ctx.beginPath();
              ctx.arc(eyeR_X, eyeR_Y, 20, 0.15 * Math.PI, 0.85 * Math.PI);
              ctx.stroke();

              ctx.restore();
            }

            // 2. Floating golden animated question marks above head in "deep thinking" mode
            ctx.save();
            const headX = canvas.width / 2;
            const headY = startY + 60; // head top level
            
            // Generate a float offset that cycles
            const qFrame = currentFrame % 90;
            const qAlpha = qFrame < 60 ? qFrame / 15 : (90 - qFrame) / 30; // fade in/out
            const qOffset = (qFrame / 90) * 50; // upwards motion
            
            ctx.globalAlpha = Math.max(0, Math.min(1, qAlpha));
            ctx.fillStyle = "#FBBF24"; // Vivid orange-yellow matching sparkles
            ctx.strokeStyle = "#111827";
            ctx.lineWidth = 6;
            ctx.lineJoin = "round";
            ctx.font = "bold 34px 'Space Grotesk', 'Inter', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            const qX = headX + Math.sin(currentFrame * 0.04) * 25 - 40;
            const qY = headY - 100 - qOffset;
            
            ctx.strokeText("?", qX, qY);
            ctx.fillText("?", qX, qY);
            ctx.restore();
          }
        } else {
          // Main footage placeholder avatar bottom left
          const size = 180;
          ctx.drawImage(avatarImg, 20, canvas.height - size - 20 + bob, size, size);
        }
      }

      currentFrame++;
      setTimeout(drawFrame, 33);
    };

    // Trigger sequential drawing
    setTimeout(drawFrame, avatarImg.complete ? 0 : 300);
  });
}
