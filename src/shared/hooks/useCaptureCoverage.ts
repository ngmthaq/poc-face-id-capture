import { useRef, useState, useCallback, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";

import { STEPS } from "../constants/steps";
import {
  COVERAGE_DETECT_INTERVAL_MS,
  MAX_RECORDING_MS,
  COMPLETE_HOLD_MS,
} from "../constants/recording";
import { MASK_THRESHOLD } from "../constants/detection";
import type { StepName } from "../types/steps";
import type { CaptureCoverageOptions, CaptureCoverage } from "../types/captureCoverage";
import { measurePose, toSvgCoords, getSvgDims } from "../utils/faceCalculations";

const isDev = import.meta.env.DEV;

/**
 * Light live face-api loop driving the progress ring. It tracks which of the
 * six steps the user's pose has passed through (each step's own `check()` is
 * the coverage threshold) and reports the current nose position. It captures
 * no frames; selection happens later in post-processing. Fires `onComplete`
 * once every step is covered or `MAX_RECORDING_MS` elapses.
 */
export function useCaptureCoverage({
  videoRef,
  active,
  onComplete,
}: CaptureCoverageOptions): CaptureCoverage {
  const [coveredSteps, setCoveredSteps] = useState<Set<StepName>>(new Set());
  const [nosePos, setNosePos] = useState<{ x: number; y: number } | null>(null);
  const [maskWarning, setMaskWarning] = useState(false);
  const [complete, setComplete] = useState(false);

  const coveredRef = useRef<Set<StepName>>(new Set());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const markCovered = useCallback((name: StepName) => {
    if (coveredRef.current.has(name)) return;
    const next = new Set(coveredRef.current);
    next.add(name);
    coveredRef.current = next;
    setCoveredSteps(next);
  }, []);

  useEffect(() => {
    if (!active) return;

    coveredRef.current = new Set();
    setCoveredSteps(new Set());
    setNosePos(null);
    setMaskWarning(false);
    setComplete(false);

    let stopped = false;
    let loopTimer = 0;
    let maskFrames = 0;
    let noMaskFrames = 0;
    const startedAt = performance.now();

    const finish = () => {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(loopTimer);
      onCompleteRef.current();
    };

    const detect = async () => {
      if (stopped) return;
      const video = videoRef.current;

      if (!video || video.paused || video.ended) {
        loopTimer = window.setTimeout(detect, COVERAGE_DETECT_INTERVAL_MS);
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.35 }),
          )
          .withFaceLandmarks(true);

        if (stopped) return;

        if (detection) {
          const pose = measurePose(detection.landmarks);
          const vw = video.videoWidth || 1;
          const vh = video.videoHeight || 1;
          const dims = getSvgDims(vw, vh);
          setNosePos(toSvgCoords(pose.noseTip.x, pose.noseTip.y, vw, vh, dims));

          if (pose.masked) {
            maskFrames++;
            noMaskFrames = 0;
          } else {
            noMaskFrames++;
            maskFrames = 0;
          }
          if (maskFrames >= MASK_THRESHOLD) setMaskWarning(true);
          else if (noMaskFrames >= MASK_THRESHOLD) setMaskWarning(false);

          if (!pose.masked) {
            for (const step of STEPS) {
              if (coveredRef.current.has(step.name)) continue;
              if (step.check(pose.yaw, pose.pitch, pose.roll)) markCovered(step.name);
            }
          }

          if (coveredRef.current.size >= STEPS.length) {
            if (isDev) console.log("[FaceReg] coverage complete — all steps covered");
            stopped = true;
            window.clearTimeout(loopTimer);
            setComplete(true);
            loopTimer = window.setTimeout(() => onCompleteRef.current(), COMPLETE_HOLD_MS);
            return;
          }
        } else {
          setNosePos(null);
        }
      } catch (err) {
        console.warn("[FaceReg] coverage detection error:", err);
      }

      if (performance.now() - startedAt >= MAX_RECORDING_MS) {
        if (isDev) console.log("[FaceReg] coverage timeout reached");
        finish();
        return;
      }

      if (!stopped) {
        loopTimer = window.setTimeout(detect, COVERAGE_DETECT_INTERVAL_MS);
      }
    };

    loopTimer = window.setTimeout(detect, COVERAGE_DETECT_INTERVAL_MS);

    return () => {
      stopped = true;
      window.clearTimeout(loopTimer);
    };
  }, [active, videoRef, markCovered]);

  return { coveredSteps, nosePos, maskWarning, complete };
}
