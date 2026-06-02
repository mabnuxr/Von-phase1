import { useEffect, useRef } from "react";

interface VoiceWaveformBarProps {
  /** Live FFT magnitudes from the AnalyserNode (Uint8 0-255 per bin). */
  freqBins: Uint8Array;
  /** Faded gray bars while connecting/processing, dark while listening. */
  active?: boolean;
}

// Dense rolling waveform: each bar holds the spectral peak captured at the
// moment that bar was committed; new bars enter on the right edge and drift
// left at a constant pixel rate. Two ideas drive the look:
//
//   1. PEAK-of-mid-band instead of full-band RMS. Voice RMS varies tightly
//      (auto-gain-control flattens it) — the peak FFT magnitude in the
//      vocal range (~80Hz–3.5kHz) swings much more between vowels,
//      sibilants, plosives, and silences. That's where the bar diversity
//      comes from.
//
//   2. Dynamic-range expansion. We track running max/min of the recent
//      signal and normalize each new sample to [0,1] against that range,
//      so the visualizer always uses the full vertical space regardless
//      of how loud or quiet the user is speaking.

const BAR_COUNT = 140;
const PUSH_INTERVAL_MS = 30;
// Per-bar width varies subtly with loudness — enough to feel alive but
// not so much that the bars look ragged. Tight range keeps the silhouette
// cohesive while still surfacing the envelope of the speech.
const BAR_WIDTH_FRAC_MIN = 0.42;
const BAR_WIDTH_FRAC_MAX = 0.6;
const MIN_HEIGHT_FRAC = 0.06;

// Light EMA on the per-frame sample to remove single-frame jitter without
// erasing the transients that give the visualizer character.
const SAMPLE_EMA = 0.55;

// Running-range trackers ease toward the live sample so quiet pockets and
// loud bursts both fit. Asymmetric: max decays slowly (keeps recent peaks
// visible), min recovers slowly (so a single quiet frame doesn't reset it).
const MAX_DECAY = 0.9985;
const MIN_RECOVER = 1.0008;

// Voice-band slice of the FFT. Bins 0–2 carry DC + sub-bass; above ~bin 50
// is mostly noise / high sibilants we don't want dominating peak detection.
const BAND_START = 3;
const BAND_END = 52;

export function VoiceWaveformBar({
  freqBins,
  active = true,
}: VoiceWaveformBarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const liveValueRef = useRef<number>(0);
  const recentMaxRef = useRef<number>(0.15);
  const recentMinRef = useRef<number>(0.02);
  const phaseRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    lastFrameRef.current = performance.now();

    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // ── 1) Sample peak FFT magnitude in the voice band ────────────────
      const bins = freqBins;
      const end = Math.min(bins.length, BAND_END);
      let peak = 0;
      for (let i = BAND_START; i < end; i++) {
        if (bins[i] > peak) peak = bins[i];
      }
      const sample = peak / 255;

      // EMA — smooth out single-frame spikes without flattening transients.
      liveValueRef.current =
        liveValueRef.current + (sample - liveValueRef.current) * SAMPLE_EMA;

      // ── 2) Update running min/max for dynamic-range expansion ─────────
      recentMaxRef.current = Math.max(
        recentMaxRef.current * MAX_DECAY,
        liveValueRef.current,
      );
      recentMinRef.current = Math.min(
        recentMinRef.current * MIN_RECOVER,
        liveValueRef.current,
      );

      // ── 3) Advance phase; commit one bar per PUSH_INTERVAL_MS ─────────
      const now = performance.now();
      const dt = Math.min(80, now - lastFrameRef.current);
      lastFrameRef.current = now;
      phaseRef.current += dt;

      while (phaseRef.current >= PUSH_INTERVAL_MS) {
        phaseRef.current -= PUSH_INTERVAL_MS;
        const span = Math.max(
          0.05,
          recentMaxRef.current - recentMinRef.current,
        );
        const normalized = Math.max(
          0,
          Math.min(1, (liveValueRef.current - recentMinRef.current) / span),
        );
        const hist = historyRef.current;
        hist.copyWithin(0, 1);
        hist[BAR_COUNT - 1] = normalized;
      }

      // ── 4) Render bars with sub-pixel scroll offset ────────────────────
      const barTotalWidth = w / BAR_COUNT;
      const midY = h / 2;
      const subPixelOffset =
        -(phaseRef.current / PUSH_INTERVAL_MS) * barTotalWidth;
      ctx.fillStyle = active ? "#111827" : "#9ca3af";

      const hist = historyRef.current;
      for (let i = 0; i < BAR_COUNT; i++) {
        const norm = hist[i];
        const barH = Math.max(MIN_HEIGHT_FRAC * h, norm * h);
        const widthFrac =
          BAR_WIDTH_FRAC_MIN + norm * (BAR_WIDTH_FRAC_MAX - BAR_WIDTH_FRAC_MIN);
        const barWidth = Math.max(1, barTotalWidth * widthFrac);
        const x =
          i * barTotalWidth + (barTotalWidth - barWidth) / 2 + subPixelOffset;
        const y = midY - barH / 2;
        const r = Math.min(barWidth / 2, 1 * dpr);
        roundRect(ctx, x, y, barWidth, barH, r);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [freqBins, active]);

  return (
    <canvas ref={canvasRef} className="w-full h-7 block" aria-hidden="true" />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
