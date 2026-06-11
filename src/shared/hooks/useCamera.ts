import { useRef, useState, useCallback } from "react";

const isDev = import.meta.env.DEV;

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(null);

  const startCamera = useCallback(async () => {
    const portrait = window.innerHeight > window.innerWidth;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: portrait ? 720 : 1366 },
        height: { ideal: portrait ? 480 : 768 },
      },
    });
    streamRef.current = stream;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
      } catch (err) {
        if (isDev) console.warn("[FaceReg] video autoplay blocked:", err);
      }
      setVideoDims({ w: video.videoWidth, h: video.videoHeight });
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setVideoDims(null);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return "";
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  return {
    videoRef,
    canvasRef,
    streamRef,
    videoDims,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
