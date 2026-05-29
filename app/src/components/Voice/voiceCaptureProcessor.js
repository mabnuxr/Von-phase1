// AudioWorklet processor for voice capture.
//
// Runs on the dedicated audio rendering thread, so it never drops samples
// when the main thread is busy (React re-renders, the visualizer RAF, live
// transcript writes) — the reliability problem ScriptProcessorNode had.
//
// Responsibilities (all on the audio thread):
//   1. Capture mono mic samples (Float32 @ the context's native rate)
//   2. Buffer ~CHUNK_SAMPLES, then downsample to 16kHz and convert to Int16
//   3. Post ready-to-send PCM chunks to the main thread (transferring the
//      buffer so there's no copy)
//
// `sampleRate` is a global in AudioWorkletGlobalScope (the context's rate).

const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 2048; // input-rate samples buffered before each post

class VoiceCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._chunks = [];
    this._length = 0;
  }

  _resampleToInt16(input, inputRate) {
    if (inputRate === TARGET_RATE) {
      const out = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return out;
    }
    const ratio = inputRate / TARGET_RATE;
    const newLength = Math.round(input.length / ratio);
    const result = new Int16Array(newLength);
    let oi = 0;
    let or = 0;
    while (or < newLength) {
      const next = Math.round((or + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = oi; i < next && i < input.length; i++) {
        accum += input[i];
        count++;
      }
      const sample = count > 0 ? accum / count : 0;
      const s = Math.max(-1, Math.min(1, sample));
      result[or] = s < 0 ? s * 0x8000 : s * 0x7fff;
      or++;
      oi = next;
    }
    return result;
  }

  _flush() {
    const merged = new Float32Array(this._length);
    let offset = 0;
    for (const c of this._chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    this._chunks = [];
    this._length = 0;
    const pcm = this._resampleToInt16(merged, sampleRate);
    this.port.postMessage(pcm, [pcm.buffer]);
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length) {
      this._chunks.push(channel.slice(0));
      this._length += channel.length;
      if (this._length >= CHUNK_SAMPLES) this._flush();
    }
    return true; // keep the processor alive
  }
}

registerProcessor("voice-capture", VoiceCaptureProcessor);
