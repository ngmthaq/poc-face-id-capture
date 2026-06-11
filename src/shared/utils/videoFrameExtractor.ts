import { FRAME_SAMPLE_INTERVAL_MS, SEEK_TIMEOUT_MS } from "../constants/faceRegister";

export interface ExtractedFrame {
  canvas: HTMLCanvasElement;
  timestampMs: number;
}

interface ExtractOptions {
  intervalMs?: number;
}

/** Huge seek target used to force the browser to resolve a real duration. */
const DURATION_PROBE_TIME = 1e101;

/**
 * Decode a recorded video Blob into sampled frames. Loads the blob into an
 * offscreen <video>, seeks at the configured interval, and draws each
 * sampled instant onto its own canvas. The object URL and video element are
 * always released before resolving (even on error).
 *
 * MediaRecorder WebM blobs are streamed without a duration written to the
 * container, so `video.duration` is reported as `Infinity`/`NaN` after
 * metadata loads. `resolveDuration` forces the browser to compute the true
 * finite duration before sampling begins.
 */
export async function extractFrames(
  blob: Blob,
  options: ExtractOptions = {},
): Promise<ExtractedFrame[]> {
  const intervalMs = options.intervalMs ?? FRAME_SAMPLE_INTERVAL_MS;
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  const frames: ExtractedFrame[] = [];

  try {
    await loadMetadata(video);
    const durationSec = await resolveDuration(video);
    const intervalSec = intervalMs / 1000;

    for (let t = 0; t < durationSec; t += intervalSec) {
      const seeked = await seek(video, t);
      if (!seeked) continue;
      const canvas = drawCurrentFrame(video);
      if (canvas) {
        frames.push({ canvas, timestampMs: t * 1000 });
      }
    }
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }

  return frames;
}

function loadMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("[FaceReg] failed to load recorded video"));
  });
}

/**
 * Return the recording's duration in seconds. When metadata reports a
 * non-finite duration (the typical MediaRecorder WebM case), seek to a huge
 * time so the browser scans the stream and reports the true duration, then
 * rewind to the start. Falls back to 0 only if the probe itself fails or
 * times out — never hangs.
 */
async function resolveDuration(video: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    return video.duration;
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("seeked", onSettled);
      clearTimeout(timer);
      resolve();
    };
    const onDurationChange = () => {
      if (Number.isFinite(video.duration)) finish();
    };
    const onSettled = () => finish();

    const timer = setTimeout(finish, SEEK_TIMEOUT_MS);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("seeked", onSettled);
    video.currentTime = DURATION_PROBE_TIME;
  });

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  // Rewind to the start before sampling; tolerate a stalled rewind seek.
  await seek(video, 0);
  return duration;
}

/**
 * Seek the video to `timeSec`. Resolves `true` once the `seeked` event fires,
 * or `false` on a video error or after `SEEK_TIMEOUT_MS` — so a stalled seek
 * skips the sample instead of hanging the pipeline forever.
 */
function seek(video: HTMLVideoElement, timeSec: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const cleanup = (result: boolean) => {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      clearTimeout(timer);
      resolve(result);
    };
    const onSeeked = () => cleanup(true);
    const onError = () => cleanup(false);

    const timer = setTimeout(() => cleanup(false), SEEK_TIMEOUT_MS);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = timeSec;
  });
}

function drawCurrentFrame(video: HTMLVideoElement): HTMLCanvasElement | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, width, height);
  return canvas;
}
