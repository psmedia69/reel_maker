# Vertical Video Reel Compositor

A high-performance, lightweight browser-based vertical video reel generator. Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**, it allows you to compose sequence layers, transitions, floating interactive decorations, and audio mixes, and export them directly to a high-quality, lightweight MP4/WebM video container without any external server processing.

## 🚀 Key Features

- **Realtime Canvas Preview**: Fluid, high-precision live preview using `requestAnimationFrame`.
- **Dynamic Elements**: Pendulum physics, custom Instagram handle syncing, and beautiful procedural falling pink/reddish hearts.
- **Client-Side Heavy Lifting**: Compiles, mixes audio, and exports vertical videos right inside the browser without sending any video data to remote servers.
- **Optimized Compilation**: Uses downscaled logical composition layers during export for buttery smooth recording without performance-driven lags or skips.

---

## 🛠️ Local Development Setup

To run this project on your machine with full functionality, follow these quick steps:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (Version 18 or later recommended) installed.

### 2. Install Dependencies
Clone your GitHub repository (or extract your exported code), open the project folder in your terminal, and install the required npm packages:

```bash
npm install
```

### 3. Run Development Server
Boot up the fast local development server:

```bash
npm run dev
```

Your terminal will display the local address (typically `http://localhost:3000`). Open it in your web browser to play around with the app!

### 4. Build for Production
To bundle and optimize the static assets for live deployment (e.g. on GitHub Pages, Vercel, or Netlify):

```bash
npm run build
```

This generates a ready-to-serve production folder named `dist/` containing highly optimized HTML, JS, and CSS files.

---

## ⚡ Technical Details & Optimizations

- **Dynamic Framerate Adaptation**: Built-in media lock prevents timeline drift by anchoring the master physical clock closely to HTML5 audio/video state elements.
- **Efficient Bitrate Recording**: Leverages a robust `MediaRecorder` setup with a dialed-in **1.8 Mbps** target video bitrate to ensure downloaded videos are extremely sharp but lightweight.
- **Canvas Matrix Transformations**: Synchronizes procedural geometry layers, custom image anchors, and interactive particles into single unified canvas sweeps.
