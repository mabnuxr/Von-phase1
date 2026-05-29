import { useCallback, useEffect, useRef, useState } from "react";

import { VOICE_FREQ_BINS, VOICE_SILENCE_RMS } from "../config/constants";
import { voiceService } from "../services/voiceService";
// AudioWorklet module URL — capture + resampling run on the audio thread.
import captureWorkletUrl from "../components/Voice/voiceCaptureProcessor.js?url";

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "reconnecting"
  | "stopping"
  | "processing"
  | "error";

/**
 * Optional cleanup step. After recording stops, the hook posts the raw
 * transcript to the backend; the LLM polishes the dictation in isolation
 * and returns the cleaned text. The caller is responsible for appending
 * that to whatever text the user had already typed — the LLM never sees
 * or touches the existing chat-input text, so it can't accidentally
 * rewrite it.
 */
export interface VoiceCleanupConfig {
  /** Fired when a polish pass completes — whether the user pressed ✓, the
   *  2-min cap fired, or a reconnect exhaustion soft-stopped the session.
   *  Receives the polished dictation alone (NOT combined with the existing
   *  chat-input text — the caller appends). This is the single channel
   *  where polished output reaches the caller; user-triggered stop() still
   *  returns the same string for convenience. */
  onPolished?: (polishedDictation: string) => void;
}

export interface UseVoiceTranscriptionResult {
  status: VoiceStatus;
  transcript: string;
  partial: string;
  micLevel: number;
  freqBins: Uint8Array;
  error: string | null;
  start: () => Promise<void>;
  /** Stops capture, runs the cleanup pass, and resolves with the final
   *  text — polished on success, raw transcript on LLM failure (the
   *  cleanup service falls back internally). The processing window keeps
   *  status === 'processing' so the UI shows the spinner until then. */
  stop: () => Promise<string>;
  /** Tear down the session WITHOUT running the cleanup pass. Used by the
   *  cancel (X) button: the user is throwing away the dictation, not asking
   *  for it to be polished. */
  cancel: () => void;
  /** Clear the surfaced error banner. Doesn't change recording state — the
   *  hook is already torn down to "error" when an error appears. */
  dismissError: () => void;
}

const DEEPGRAM_WS = "wss://api.deepgram.com/v1/listen";
const DEEPGRAM_QUERY = new URLSearchParams({
  model: "nova-3",
  language: "en",
  smart_format: "true",
  punctuate: "true",
  interim_results: "true",
  encoding: "linear16",
  sample_rate: "16000",
  channels: "1",
}).toString();

const CHUNK_INTERVAL_MS = 100;
// Hard ceiling on a single dictation session. If the WS has been open this
// long, we auto-confirm and run the polish pass — protects the user from
// an accidentally-held hotkey, a forgotten mic, and runaway Deepgram /
// OpenAI usage. Tightly scoped to the recording window only.
const SESSION_MAX_MS = 120_000;
// Reconnect backoff: try fast, then ease off. After this list is exhausted
// we soft-stop and polish whatever was transcribed before the drop, so the
// user keeps their dictation rather than losing it.
const RECONNECT_DELAYS_MS = [250, 750, 2000];

export function useVoiceTranscription(options?: {
  cleanup?: VoiceCleanupConfig;
}): UseVoiceTranscriptionResult {
  const cleanupConfig = options?.cleanup;
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const rafRef = useRef<number | null>(null);
  // Aborts an in-flight cleanup stream when the user re-starts dictation.
  const cleanupAbortRef = useRef<AbortController | null>(null);
  // Periodic KeepAlive so Deepgram doesn't idle-close the socket; cleared on stop.
  const keepAliveRef = useRef<number | null>(null);
  // Fails the session if the socket never opens within the timeout.
  const connectTimeoutRef = useRef<number | null>(null);
  // Hard cap on session duration — fires SESSION_MAX_MS after the WS opens
  // and auto-runs the polish pass. Cleared on stop / cancel / cleanup.
  const sessionCapTimeoutRef = useRef<number | null>(null);
  // Forward ref to stop(): the session-cap timer is armed in `onopen` (which
  // closes over the start() callback) but needs to invoke stop(), which is
  // declared later in this hook. The effect below keeps this ref in sync.
  const stopRef = useRef<(() => Promise<string>) | null>(null);

  // Reconnect lifecycle ─────────────────────────────────────────────
  // A WS drop after the initial connect is treated as transient: keep the
  // mic + worklet alive, switch UI to "reconnecting", retry with backoff.
  // Audio captured during the gap accumulates in preconnectBufferRef and is
  // drained the moment the new socket opens.
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  // Cached Deepgram key — reused across reconnects if still valid (the
  // backend issues 60s keys, so brief blips usually skip the mint round-trip).
  const cachedKeyRef = useRef<{ key: string; expiresAt: number } | null>(null);
  // Flips true once a WS has opened successfully. Drop handler only triggers
  // a reconnect if true — initial-connect failures stay terminal so the user
  // gets a clear "voice service did not respond" instead of silent retries.
  const wsEstablishedRef = useRef(false);
  // Guard against double-firing of the drop handler (onerror followed by
  // onclose) and against drop-during-stop races.
  const isReconnectingRef = useRef(false);
  // Re-entry lock for stop() — user ✓ and the 2-min cap can fire within
  // milliseconds of each other; without this we'd POST /voice/cleanup
  // twice and write the same polished text to the input twice.
  const isStoppingRef = useRef(false);
  // Audio captured before the WebSocket opens is held here, then drained
  // in onopen — so audio spoken during "Connecting…" is never lost.
  const preconnectBufferRef = useRef<Int16Array[]>([]);
  const sendBufferRef = useRef<Int16Array[]>([]);
  const lastFlushRef = useRef(0);
  const freqBinsRef = useRef<Uint8Array<ArrayBuffer>>(
    new Uint8Array(new ArrayBuffer(VOICE_FREQ_BINS)),
  );
  const finalAccumRef = useRef("");
  const partialTextRef = useRef("");

  // WebSocket-only teardown: closes the socket, nulls its handlers, and
  // stops the KeepAlive / connect-timeout that are bound to its lifetime.
  // Called by the drop handler before a reconnect attempt — keeps the audio
  // pipeline (mic, AudioContext, worklet) running so PCM keeps flowing into
  // the preconnect buffer during the gap.
  const cleanupWebSocket = useCallback(() => {
    if (keepAliveRef.current != null) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    if (connectTimeoutRef.current != null) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      try {
        wsRef.current.close();
      } catch {
        /* noop */
      }
      wsRef.current = null;
    }
  }, []);

  // Full session teardown — WS + audio pipeline + all timers + buffers.
  // Called by stop / cancel / unmount, and defensively at the top of start.
  const cleanup = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    cleanupWebSocket();
    if (sessionCapTimeoutRef.current != null) {
      clearTimeout(sessionCapTimeoutRef.current);
      sessionCapTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current != null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    isReconnectingRef.current = false;
    isStoppingRef.current = false;
    wsEstablishedRef.current = false;
    cachedKeyRef.current = null;
    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.port.onmessage = null;
        workletNodeRef.current.disconnect();
      } catch {
        /* noop */
      }
      workletNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        /* noop */
      }
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        /* noop */
      }
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    sendBufferRef.current = [];
    preconnectBufferRef.current = [];
    setMicLevel(0);
  }, [cleanupWebSocket]);

  useEffect(() => cleanup, [cleanup]);

  const flushBuffer = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const chunks = sendBufferRef.current;
    if (chunks.length === 0) return;
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Int16Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    sendBufferRef.current = [];
    ws.send(merged.buffer);
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (typeof event.data !== "string") return;
    let msg: {
      type?: string;
      channel?: { alternatives?: Array<{ transcript?: string }> };
      is_final?: boolean;
      description?: string;
    };
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    // Surface Deepgram-side errors instead of silently producing no transcript.
    if (msg.type === "Error") {
      console.error("[useVoiceTranscription] Deepgram error:", msg.description);
      return;
    }
    if (msg.type !== "Results") return;
    const text = msg.channel?.alternatives?.[0]?.transcript?.trim() ?? "";
    if (!text) return;

    if (msg.is_final) {
      finalAccumRef.current = [finalAccumRef.current, text]
        .filter(Boolean)
        .join(" ")
        .trim();
      partialTextRef.current = "";
      setTranscript(finalAccumRef.current);
      setPartial("");
    } else {
      partialTextRef.current = text;
      setPartial(text);
      setTranscript(
        [finalAccumRef.current, text].filter(Boolean).join(" ").trim(),
      );
    }
  }, []);

  // ── Reconnect lifecycle ────────────────────────────────────────────
  //
  // Opens a fresh WS (reusing the cached key if still valid, otherwise
  // minting a new one) and wires the same drop-aware handlers as start().
  // The mic + worklet are still running, so PCM is accumulating in
  // preconnectBufferRef during the gap — `onopen` drains it.
  //
  // Mutual recursion with scheduleReconnect via a ref so the dependency
  // arrays stay clean (and so a rapidly-firing onclose/onerror pair
  // doesn't get the wrong reference mid-render).
  const scheduleReconnectRef = useRef<(() => void) | null>(null);

  const openReconnectSocket = useCallback(async (): Promise<void> => {
    let cached = cachedKeyRef.current;
    const now = Date.now();
    // Backend issues 60s keys; pad by 5s to avoid using one that expires
    // mid-handshake.
    if (!cached || now >= cached.expiresAt - 5_000) {
      const fresh = await voiceService.getDeepgramKey();
      cached = {
        key: fresh.key,
        expiresAt: Date.parse(fresh.expires_at),
      };
      cachedKeyRef.current = cached;
    }

    const ws = new WebSocket(`${DEEPGRAM_WS}?${DEEPGRAM_QUERY}`, [
      "token",
      cached.key,
    ]);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      // Drain everything captured during the drop window — zero-loss.
      const pending = preconnectBufferRef.current;
      preconnectBufferRef.current = [];
      for (const chunk of pending) sendBufferRef.current.push(chunk);
      flushBuffer();
      lastFlushRef.current = performance.now();

      keepAliveRef.current = window.setInterval(() => {
        const sock = wsRef.current;
        if (sock && sock.readyState === WebSocket.OPEN) {
          try {
            sock.send(JSON.stringify({ type: "KeepAlive" }));
          } catch {
            /* noop */
          }
        }
      }, 5000);

      reconnectAttemptRef.current = 0;
      isReconnectingRef.current = false;
      wsEstablishedRef.current = true;
      setStatus("listening");
    };
    ws.onmessage = handleMessage;
    ws.onerror = () => {
      handleWsDropRef.current?.();
    };
    ws.onclose = () => {
      handleWsDropRef.current?.();
    };
  }, [flushBuffer, handleMessage]);

  // Schedule the next reconnect attempt with the next backoff value. If
  // we've exhausted RECONNECT_DELAYS_MS, soft-stop via stopRef so the user
  // keeps whatever was transcribed before the drop.
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= RECONNECT_DELAYS_MS.length) {
      isReconnectingRef.current = false;
      void stopRef.current?.();
      return;
    }
    const delay = RECONNECT_DELAYS_MS[reconnectAttemptRef.current];
    reconnectAttemptRef.current += 1;
    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      openReconnectSocket().catch(() => {
        // Key mint or WS construction failed — try the next backoff slot.
        scheduleReconnectRef.current?.();
      });
    }, delay);
  }, [openReconnectSocket]);

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  }, [scheduleReconnect]);

  // Drop handler — invoked by ws.onerror / ws.onclose. Only kicks off a
  // reconnect if the WS was previously established; initial-connect
  // failures stay terminal so the user gets a clear error rather than
  // silent retries (and the connectTimeout already owns that path).
  const handleWsDropRef = useRef<(() => void) | null>(null);
  const handleWsDrop = useCallback(() => {
    if (!wsEstablishedRef.current) return;
    if (isReconnectingRef.current) return;
    isReconnectingRef.current = true;
    wsEstablishedRef.current = false;
    cleanupWebSocket();
    setStatus("reconnecting");
    reconnectAttemptRef.current = 0;
    scheduleReconnect();
  }, [cleanupWebSocket, scheduleReconnect]);

  useEffect(() => {
    handleWsDropRef.current = handleWsDrop;
  }, [handleWsDrop]);

  const start = useCallback(async () => {
    if (status === "connecting" || status === "listening") return;

    if (cleanupAbortRef.current) {
      cleanupAbortRef.current.abort();
      cleanupAbortRef.current = null;
    }
    cleanup();
    setError(null);
    setTranscript("");
    setPartial("");
    finalAccumRef.current = "";
    partialTextRef.current = "";
    sendBufferRef.current = [];
    preconnectBufferRef.current = [];
    lastFlushRef.current = 0;
    freqBinsRef.current.fill(0);
    setMicLevel(0);
    setStatus("connecting");

    try {
      // Kick off mic capture + key fetch in parallel. The browser shows the
      // permission prompt immediately on the user gesture, while the HTTP
      // request to mint a Deepgram key happens concurrently.
      const [stream, keyResponse] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }),
        voiceService.getDeepgramKey(),
      ]);
      mediaStreamRef.current = stream;

      // Wire up audio capture BEFORE the WebSocket is open. Frames produced
      // during the connect window are buffered into preconnectBufferRef and
      // drained the moment the WS opens — zero-loss connection handoff.
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      // CRITICAL: getUserMedia is async, so the user-gesture window may have
      // lapsed by the time we construct the AudioContext — it can start
      // "suspended", in which case onaudioprocess never fires and NO audio
      // reaches Deepgram (silent session). Resuming guarantees it runs.
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = VOICE_FREQ_BINS * 2;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Capture runs on the audio thread via an AudioWorklet — it resamples
      // to 16kHz Int16 and posts ready-to-send PCM chunks here. Immune to
      // main-thread jank, so no dropped samples / partial transcripts.
      await ctx.audioWorklet.addModule(captureWorkletUrl);
      const workletNode = new AudioWorkletNode(ctx, "voice-capture");
      workletNodeRef.current = workletNode;
      workletNode.port.onmessage = (e: MessageEvent<Int16Array>) => {
        const pcm = e.data;
        const ws = wsRef.current;
        // Anything other than an OPEN socket goes into the preconnect
        // buffer — covers initial connecting, reconnecting after a drop,
        // and the brief moments between WS lifecycle transitions. The
        // moment a (re)connection opens, this buffer is drained.
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          preconnectBufferRef.current.push(pcm);
          return;
        }
        sendBufferRef.current.push(pcm);
        const now = performance.now();
        if (now - lastFlushRef.current >= CHUNK_INTERVAL_MS) {
          lastFlushRef.current = now;
          flushBuffer();
        }
      };
      source.connect(workletNode);
      // Connect to destination so the graph keeps pulling audio through the
      // worklet. process() writes no output, so this plays pure silence.
      workletNode.connect(ctx.destination);

      // Open the WebSocket. We don't await onopen here so audio can already
      // be buffering by the time this promise resolves.
      const ws = new WebSocket(`${DEEPGRAM_WS}?${DEEPGRAM_QUERY}`, [
        "token",
        keyResponse.key,
      ]);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      // Fail clearly if the socket never opens (bad key, network, Deepgram
      // outage) instead of hanging forever in "connecting".
      connectTimeoutRef.current = window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          setError("Voice service did not respond");
          setStatus("error");
          cleanup();
        }
      }, 6000);

      ws.onopen = () => {
        if (connectTimeoutRef.current != null) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        // Cache the key so a brief WS drop can reconnect without minting
        // a fresh one — the backend issues 60s keys.
        cachedKeyRef.current = {
          key: keyResponse.key,
          expiresAt: Date.parse(keyResponse.expires_at),
        };

        // Drain everything captured during the connect window.
        const pending = preconnectBufferRef.current;
        preconnectBufferRef.current = [];
        for (const chunk of pending) sendBufferRef.current.push(chunk);
        flushBuffer();
        lastFlushRef.current = performance.now();

        // KeepAlive heartbeat — Deepgram closes the socket after ~10s without
        // data. We stream PCM continuously while the context runs, but this
        // is a cheap safety net against any gap.
        keepAliveRef.current = window.setInterval(() => {
          const sock = wsRef.current;
          if (sock && sock.readyState === WebSocket.OPEN) {
            try {
              sock.send(JSON.stringify({ type: "KeepAlive" }));
            } catch {
              /* noop */
            }
          }
        }, 5000);

        // Arm the hard session cap. Fires the same flow as the user pressing
        // ✓ — stop capture and run the polish pass on whatever they said.
        sessionCapTimeoutRef.current = window.setTimeout(() => {
          sessionCapTimeoutRef.current = null;
          void stopRef.current?.();
        }, SESSION_MAX_MS);

        wsEstablishedRef.current = true;
        setStatus("listening");
      };
      ws.onmessage = handleMessage;
      // ws.onerror / ws.onclose go through handleWsDrop — if the WS was
      // ever established, a drop kicks off a reconnect (audio keeps
      // capturing into the preconnect buffer in the meantime). If the
      // initial connect itself drops, the connectTimeout above owns the
      // error so this becomes a no-op.
      ws.onerror = () => {
        handleWsDropRef.current?.();
      };
      ws.onclose = () => {
        handleWsDropRef.current?.();
      };

      // Visualizer tick — only reads mic level. The visualizer component
      // decides whether to *display* it based on the `active` prop.
      const tick = () => {
        const a = analyserRef.current;
        if (!a) return;
        a.getByteFrequencyData(freqBinsRef.current);
        let sum = 0;
        for (let i = 0; i < freqBinsRef.current.length; i++) {
          const v = freqBinsRef.current[i] / 255;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / freqBinsRef.current.length);
        setMicLevel(rms < VOICE_SILENCE_RMS ? 0 : rms);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.error("[useVoiceTranscription] start failed:", e);
      // Map known browser errors to user-friendly copy. Permission denied
      // is the only one users can fix themselves (browser settings), so
      // it gets the most actionable message; everything else is "we'll
      // try again" generic.
      const isPermissionDenied =
        e instanceof DOMException &&
        (e.name === "NotAllowedError" || e.name === "PermissionDeniedError");
      setError(
        isPermissionDenied
          ? "Microphone access is blocked. Enable it in your browser settings to use voice."
          : e instanceof Error
            ? e.message
            : "Failed to start voice session",
      );
      setStatus("error");
      cleanup();
    }
  }, [cleanup, flushBuffer, handleMessage, status]);

  const stop = useCallback(async (): Promise<string> => {
    if (status === "idle") return finalAccumRef.current;
    // Re-entry lock: user ✓ and the 2-min cap can both trip stop() within
    // microseconds. Without this we'd POST /voice/cleanup twice (wasteful)
    // and fire onPolished twice (also wasteful). The first call owns the
    // polish flow; subsequent calls return the current accumulator and
    // bail. Released in the finally below.
    if (isStoppingRef.current) return finalAccumRef.current;
    isStoppingRef.current = true;
    try {
      setStatus("stopping");

      // Cancel any pending reconnect — the user is intentionally finishing,
      // so any further attempt would race with our polish pass.
      if (reconnectTimeoutRef.current != null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      isReconnectingRef.current = false;
      wsEstablishedRef.current = false;

      // Detach the close/error handlers NOW. After we send CloseStream below,
      // Deepgram closes the socket from its end during the 400ms wait — if the
      // handler were still attached, our drop handler would try to reconnect
      // mid-stop instead of letting the polish flow run.
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
      }
      // Stop the heartbeat so it can't fire after CloseStream.
      if (keepAliveRef.current != null) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }

      // Drain any pending audio, then tell Deepgram we're done so it returns
      // a final transcript for the in-flight utterance.
      flushBuffer();
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "CloseStream" }));
        } catch {
          /* noop */
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      const rawTranscript = [finalAccumRef.current, partialTextRef.current]
        .filter(Boolean)
        .join(" ")
        .trim();
      cleanup();

      // Hook emits ONLY the polished dictation. Concatenation with the
      // user's existing chat-input text is the caller's job — that way the
      // LLM never sees or rewrites pre-existing text. Failure paths emit
      // the raw transcript so the caller can still append it.
      const emitPolished = (text: string) => {
        cleanupConfig?.onPolished?.(text);
      };

      if (cleanupConfig && rawTranscript) {
        setStatus("processing");
        const controller = new AbortController();
        cleanupAbortRef.current = controller;
        try {
          // Discard streaming deltas — the input shell shows the existing
          // text + a spinner during processing, and the polished dictation
          // lands in one update once the promise resolves.
          const polished = await voiceService.streamCleanup({
            newDictation: rawTranscript,
            onProgress: () => undefined,
            signal: controller.signal,
          });
          cleanupAbortRef.current = null;
          const finalText = polished || rawTranscript;
          emitPolished(finalText);
          setStatus("idle");
          return finalText;
        } catch (e) {
          cleanupAbortRef.current = null;
          // AbortError = caller started a new dictation — leave status alone,
          // start() has already (or will shortly) re-set it to "connecting".
          // Skip emit too; the new session will produce its own polished text.
          if (e instanceof DOMException && e.name === "AbortError") {
            return rawTranscript;
          }
          // Any other failure: surface the raw transcript so the user
          // doesn't lose what they said. The caller appends it to existing.
          console.error("[useVoiceTranscription] cleanup failed:", e);
          emitPolished(rawTranscript);
          setStatus("idle");
          return rawTranscript;
        }
      }

      emitPolished(rawTranscript);
      setStatus("idle");
      return rawTranscript;
    } finally {
      isStoppingRef.current = false;
    }
  }, [cleanup, cleanupConfig, flushBuffer, status]);

  // Keep the forward ref aligned with the latest `stop` closure so the
  // session-cap timer fires the current handler (not a stale one from when
  // the WS opened).
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const cancelSession = useCallback(() => {
    if (cleanupAbortRef.current) {
      cleanupAbortRef.current.abort();
      cleanupAbortRef.current = null;
    }
    finalAccumRef.current = "";
    partialTextRef.current = "";
    setTranscript("");
    setPartial("");
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    status,
    transcript,
    partial,
    micLevel,
    freqBins: freqBinsRef.current,
    error,
    start,
    stop,
    cancel: cancelSession,
    dismissError,
  };
}
