import { useRef, useCallback } from "react";

const isDev = import.meta.env.DEV;

const PREFERRED_MIME_TYPES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

function pickSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Thin MediaRecorder wrapper. `startRecording(stream)` begins capturing the
 * passed MediaStream; `stopRecording()` resolves a single Blob assembled from
 * the recorded chunks. The codec is feature-detected, falling back gracefully
 * when none of the preferred types are supported.
 */
export function useFaceRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback((stream: MediaStream) => {
    const mimeType = pickSupportedMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    if (isDev) {
      console.log(`[FaceReg] recording with mimeType=${recorder.mimeType}`);
    }

    recorder.start();
    recorderRef.current = recorder;
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob(chunksRef.current, { type: recorder?.mimeType }));
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        recorderRef.current = null;
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return { startRecording, stopRecording };
}
