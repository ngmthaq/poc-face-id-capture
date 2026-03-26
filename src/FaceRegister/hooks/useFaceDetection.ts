import { useRef, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import {
  STEPS,
  COUNTDOWN_MS,
  MISS_GRACE,
  MASK_THRESHOLD,
  type Capture,
} from "../constants";
import {
  getEyeCenter,
  calcYaw,
  calcPitch,
  calcRoll,
  toSvgCoords,
  checkFaceCentered,
  checkMask,
  getSvgDims,
} from "../utils/faceCalculations";

interface DetectionCallbacks {
  setMatched: (v: boolean) => void;
  setCountdownActive: (v: boolean) => void;
  setNosePos: (v: { x: number; y: number } | null) => void;
  setMaskWarning: (v: boolean) => void;
  setOutsideOval: (v: boolean) => void;
  setCaptures: (v: Capture[]) => void;
  setShowFlash: (v: boolean) => void;
  setCurrentStep: (v: number) => void;
  setCrosshairPos: (v: { x: number; y: number }) => void;
  setScreen: (v: "intro" | "capture" | "result") => void;
  captureFrame: () => string;
  stopCamera: () => void;
}

export function useFaceDetection(callbacks: DetectionCallbacks) {
  const loopRef = useRef<number>(0);
  const countdownStart = useRef<number>(0);

  const runDetection = useCallback(
    (
      stepIdx: number,
      capturesSoFar: Capture[],
      videoRef: React.RefObject<HTMLVideoElement | null>,
    ) => {
      const step = STEPS[stepIdx];
      if (!step) return;
      const stepCountdown = step.countdown ?? COUNTDOWN_MS;

      let isMatched = false;
      let cdStart = 0;
      let missCount = 0;
      let stopped = false;
      let maskFrames = 0;
      let noMaskFrames = 0;

      const detect = async () => {
        if (stopped) return;
        const video = videoRef.current;
        if (!video || video.paused || video.ended) {
          loopRef.current = window.setTimeout(detect, 200);
          return;
        }

        try {
          const detection = await faceapi
            .detectSingleFace(
              video,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 320,
                scoreThreshold: 0.35,
              }),
            )
            .withFaceLandmarks(true);

          if (stopped) return;

          if (detection) {
            const lm = detection.landmarks;
            const positions = lm.positions;
            const noseTip = positions[30];
            const leftEyeCenter = getEyeCenter(lm.getLeftEye());
            const rightEyeCenter = getEyeCenter(lm.getRightEye());
            const eyeMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
            const eyeMidY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
            const jaw = lm.getJawOutline();
            const faceWidth = Math.abs(jaw[jaw.length - 1].x - jaw[0].x);
            const faceHeight = Math.abs(positions[8].y - positions[19].y);

            // Mask detection (lip gap)
            const lipGap =
              Math.abs(positions[57].y - positions[51].y) / faceHeight;
            const maskThisFrame = checkMask(
              positions[51].y,
              positions[57].y,
              faceHeight,
            );

            if (maskThisFrame) {
              maskFrames++;
              noMaskFrames = 0;
            } else {
              noMaskFrames++;
              maskFrames = 0;
            }

            const maskConfirmed = maskFrames >= MASK_THRESHOLD;
            const noMaskConfirmed = noMaskFrames >= MASK_THRESHOLD;

            if (maskConfirmed) {
              callbacks.setMaskWarning(true);
            } else if (noMaskConfirmed) {
              callbacks.setMaskWarning(false);
            }

            console.log(
              `[FaceReg] lipGap=${lipGap.toFixed(3)} mask=${maskConfirmed ? "yes" : "no"} (${maskFrames}/${MASK_THRESHOLD})`,
            );

            if (maskConfirmed) {
              callbacks.setNosePos(null);
              loopRef.current = window.setTimeout(detect, 100);
              return;
            }

            const yaw = calcYaw(noseTip.x, eyeMidX, faceWidth);
            const pitch = calcPitch(noseTip.y, eyeMidY, faceHeight);
            const roll = calcRoll(leftEyeCenter, rightEyeCenter);

            const vw = video.videoWidth || 1;
            const vh = video.videoHeight || 1;
            const dims = getSvgDims(vw, vh);
            const svgPos = toSvgCoords(noseTip.x, noseTip.y, vw, vh, dims);
            callbacks.setNosePos(svgPos);

            // Face centering check (center step only)
            const isCentered = checkFaceCentered(positions, vw, vh, dims);
            const centerOk = step.name === "center" ? isCentered : true;
            callbacks.setOutsideOval(!centerOk);

            const passes = centerOk && step.check(yaw, pitch, roll);

            console.log(
              `[FaceReg] step=${step.name} yaw=${yaw.toFixed(1)} pitch=${pitch.toFixed(1)} roll=${roll.toFixed(1)} centered=${isCentered} pass=${passes}`,
            );

            if (passes) {
              missCount = 0;
              if (!isMatched) {
                isMatched = true;
                cdStart = performance.now();
                callbacks.setMatched(true);
                callbacks.setCountdownActive(true);
                countdownStart.current = cdStart;
              }
              const elapsed = performance.now() - cdStart;

              if (elapsed >= stepCountdown) {
                stopped = true;
                const data = callbacks.captureFrame();
                const newCapture: Capture = {
                  step: step.name,
                  labelKey: step.labelKey,
                  data,
                };
                const updatedCaptures = [...capturesSoFar, newCapture];
                callbacks.setCaptures(updatedCaptures);
                callbacks.setShowFlash(true);
                setTimeout(() => callbacks.setShowFlash(false), 350);
                callbacks.setMatched(false);
                callbacks.setCountdownActive(false);

                const nextIdx = stepIdx + 1;
                if (nextIdx >= STEPS.length) {
                  callbacks.stopCamera();
                  callbacks.setScreen("result");
                  return;
                }
                callbacks.setCurrentStep(nextIdx);
                callbacks.setCrosshairPos(STEPS[nextIdx].target);
                setTimeout(
                  () => runDetection(nextIdx, updatedCaptures, videoRef),
                  400,
                );
                return;
              }
            } else {
              missCount++;
              if (isMatched && missCount >= MISS_GRACE) {
                isMatched = false;
                cdStart = 0;
                missCount = 0;
                callbacks.setMatched(false);
                callbacks.setCountdownActive(false);
              }
            }
          } else {
            callbacks.setNosePos(null);
            missCount++;
            if (isMatched && missCount >= MISS_GRACE) {
              isMatched = false;
              cdStart = 0;
              missCount = 0;
              callbacks.setMatched(false);
              callbacks.setCountdownActive(false);
            }
          }
        } catch (err) {
          console.warn("[FaceReg] detection error:", err);
        }

        if (!stopped) {
          loopRef.current = window.setTimeout(detect, 100);
        }
      };

      loopRef.current = window.setTimeout(detect, 100);

      return () => {
        stopped = true;
        clearTimeout(loopRef.current);
      };
    },
    [callbacks],
  );

  return { loopRef, countdownStart, runDetection };
}
