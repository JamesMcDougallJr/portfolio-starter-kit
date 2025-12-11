import React from "react";

export default function HeroTitle() {
  return (
    <svg
      // Give extra bleed on left/right so effects aren't clipped
      viewBox="-200 0 1600 400"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="auto"
      role="img"
      aria-labelledby="title"
      // If your page has strict containers, this also helps:
      style={{ overflow: "visible", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>James McDougall - Software Engineer & Problem Solver</title>

      {/* Background spanning the wider viewBox - theme aware */}
      <rect x="-200" y="0" width="1600" height="400" className="fill-slate-100 dark:fill-slate-950" />

      <defs>
        {/* Moving background glow - blue/purple theme */}
        <radialGradient id="bgGlow" cx="78%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
          <stop offset="40%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
          <animate attributeName="cx" values="76%;82%;76%" dur="22s" repeatCount="indefinite" />
          <animate attributeName="r" values="60%;70%;60%" dur="26s" repeatCount="indefinite" />
        </radialGradient>

        {/* Vignette */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
          <stop offset="70%" className="dark:stop-color-slate-950 stop-color-slate-100" stopOpacity="0" />
          <stop offset="100%" className="dark:stop-color-slate-950 stop-color-slate-100" stopOpacity="0.55" />
        </radialGradient>

        {/* Flare gradient - blue/purple tones */}
        <linearGradient id="flareGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
          <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>

        {/* Text gradient - theme aware */}
        <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        {/* Soft text glow */}
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Flare blur */}
        <filter id="flareBlur">
          <feGaussianBlur stdDeviation="25" />
        </filter>
      </defs>

      {/* Background glow */}
      <rect x="-200" y="0" width="1600" height="400" fill="url(#bgGlow)" />

      {/* Animated flare sweep (now travels beyond the extended edges) */}
      <g opacity="0.85" style={{ mixBlendMode: "screen" }} filter="url(#flareBlur)">
        <rect x="-500" y="-50" width="300" height="500" fill="url(#flareGrad)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-500,0; 1800,0; -500,0"
            dur="30s"
            repeatCount="indefinite"
          />
        </rect>

        <rect x="-350" y="-100" width="200" height="520" fill="url(#flareGrad)" opacity="0.35">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="1600,0; -400,0; 1600,0"
            dur="42s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      {/* Vignette */}
      <rect x="-200" y="0" width="1600" height="400" fill="url(#vignette)" />

      {/* Main text (still centered in the visual frame) */}
      <text
        x="600"           // center of the original 1200-wide frame inside the extended viewBox
        y="57%"
        textAnchor="middle"
        fill="url(#silver)"
        filter="url(#softGlow)"
        fontFamily='"Inter","Segoe UI",system-ui,-apple-system,Arial,sans-serif'
        fontSize="80"
        fontWeight="700"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      >
        James McDougall - Software Engineer &amp; Problem Solver
      </text>
    </svg>
  );
}

