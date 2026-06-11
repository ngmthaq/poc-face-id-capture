import { useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";

import { STEPS, CAPTURE_JPEG_QUALITY } from "../constants/faceRegister";
import { measurePose } from "../utils/faceCalculations";
import {
  scorePoseAgainstStep,
  selectBestFramesPerStep,
  type ScoredFrame,
  type FrameSelection,
} from "../utils/poseScoring";
import { extractFrames } from "../utils/videoFrameExtractor";

const isDev = import.meta.env.DEV;

/**
 * Post-process a recorded Blob: sample frames, run face-api landmarks on each,
 * derive yaw/pitch/roll, skip masked frames, score every frame against all six
 * steps, then select the best qualifying frame per step. Each returned capture
 * carries a JPEG data URL rendered from its source frame.
 */
export function usePostProcess() {
  const process = useCallback(async (blob: Blob): Promise<FrameSelection> => {
    const frames = await extractFrames(blob);
    if (isDev) console.log(`[FaceReg] post-process sampled ${frames.length} frames`);

    const scoredFrames: ScoredFrame[] = [];

    for (const frame of frames) {
      const detection = await faceapi
        .detectSingleFace(
          frame.canvas,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 }),
        )
        .withFaceLandmarks(true);

      if (!detection) continue;

      const pose = measurePose(detection.landmarks);
      if (pose.masked) continue;

      const data = frame.canvas.toDataURL("image/jpeg", CAPTURE_JPEG_QUALITY);

      for (const step of STEPS) {
        scoredFrames.push({
          step,
          score: scorePoseAgainstStep(step, pose.yaw, pose.pitch, pose.roll),
          qualifies: step.check(pose.yaw, pose.pitch, pose.roll),
          data,
        });
      }
    }

    const selection = selectBestFramesPerStep(scoredFrames);
    if (isDev) {
      console.log(
        `[FaceReg] post-process selected ${selection.captures.length} captures, missing=[${selection.missingSteps.join(",")}]`,
      );
    }
    return selection;
  }, []);

  return { process };
}
