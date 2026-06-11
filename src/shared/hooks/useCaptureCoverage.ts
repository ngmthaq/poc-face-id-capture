import { useRef, useState, useCallback, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";

import { STEPS } from "../constants/steps";
import {
  COVERAGE_DETECT_INTERVAL_MS,
  RECORDING_SAFETY_CAP_MS,
  COMPLETE_HOLD_MS,
  SWEEP_DEADZONE_MAG,
  SWEEP_FILL_TOLERANCE_DEG,
} from "../constants/recording";
import { TICK_COUNT } from "../constants/geometry";
import { MASK_THRESHOLD } from "../constants/detection";
import type { CaptureCoverageOptions, CaptureCoverage } from "../types/captureCoverage";
import {
  measurePose,
  toSvgCoords,
  getSvgDims,
  poseToRingAngle,
  ticksForAngle,
} from "../utils/faceCalculations";

const isDev = import.meta.env.DEV;

/**
 * Light live face-api loop driving the progress ring. A `center` alignment gate
 * must pass first (the center step's own `check()`); once centered, the user
 * slowly rotates their head and each ring tick fills only when the head points
 * in that tick's direction. It captures no frames; selection happens later in
 * post-processing. Fires `onComplete` once center is covered and all ticks are
 * filled, or `RECORDING_SAFETY_CAP_MS` elapses.
 */
export function useCaptureCoverage({
  videoRef,
  active,
  onComplete,
}: CaptureCoverageOptions): CaptureCoverage {
  const [coveredTicks, setCoveredTicks] = useState<Set<number>>(new Set());
  const [centerCovered, setCenterCovered] = useState(false);
  const [nosePos, setNosePos] = useState<{ x: number; y: number } | null>(null);
  const [maskWarning, setMaskWarning] = useState(false);
  const [complete, setComplete] = useState(false);

  const coveredTicksRef = useRef<Set<number>>(new Set());
  const centerCoveredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const markTicks = useCallback((indices: number[]) => {
    let changed = false;
    const next = new Set(coveredTicksRef.current);
    for (const i of indices) {
      if (!next.has(i)) {
        next.add(i);
        changed = true;
      }
    }
    if (!changed) return;
    coveredTicksRef.current = next;
    setCoveredTicks(next);
  }, []);

  useEffect(() => {
    if (!active) return;

    coveredTicksRef.current = new Set();
    centerCoveredRef.current = false;
    setCoveredTicks(new Set());
    setCenterCovered(false);
    setNosePos(null);
    setMaskWarning(false);
    setComplete(false);

    const centerStep = STEPS.find((s) => s.name === "center");

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
            if (!centerCoveredRef.current) {
              if (centerStep?.check(pose.yaw, pose.pitch, pose.roll)) {
                centerCoveredRef.current = true;
                setCenterCovered(true);
              }
            } else {
              const mag = Math.hypot(pose.yaw, pose.pitch);
              if (mag >= SWEEP_DEADZONE_MAG) {
                const theta = poseToRingAngle(pose.yaw, pose.pitch);
                markTicks(ticksForAngle(theta, TICK_COUNT, SWEEP_FILL_TOLERANCE_DEG));
              }
            }
          }

          if (centerCoveredRef.current && coveredTicksRef.current.size >= TICK_COUNT) {
            if (isDev) console.log("[FaceReg] coverage complete — center + all ticks covered");
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

      if (performance.now() - startedAt >= RECORDING_SAFETY_CAP_MS) {
        if (isDev) console.log("[FaceReg] coverage safety cap reached");
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
  }, [active, videoRef, markTicks]);

  return { coveredTicks, centerCovered, nosePos, maskWarning, complete };
}
