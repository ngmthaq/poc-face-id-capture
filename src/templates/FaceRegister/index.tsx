import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { SVG_WIDTH, OVAL_CX, type Screen } from "../../shared/constants/faceRegister";
import type {
  Capture,
  FaceRegisterProps,
  FaceRegisterTranslations,
} from "../../shared/types/faceRegister";
import { TranslationProvider, resolveTranslations } from "../../shared/translations";
import { injectStyles, S } from "../../shared/styles/faceRegister";
import { useCamera } from "../../shared/hooks/useCamera";
import { useFaceModels } from "../../shared/hooks/useFaceModels";
import { useFaceRecorder } from "../../shared/hooks/useFaceRecorder";
import { useCaptureCoverage } from "../../shared/hooks/useCaptureCoverage";
import { usePostProcess } from "../../shared/hooks/usePostProcess";
import { getSvgDims } from "../../shared/utils/faceCalculations";
import IntroScreen from "../../organisms/IntroScreen";
import CaptureScreen from "../../organisms/CaptureScreen";
import ProcessingScreen from "../../organisms/ProcessingScreen";
import RetryScreen from "../../organisms/RetryScreen";
import ResultScreen from "../../organisms/ResultScreen";
import LoadingOverlay from "../../molecules/LoadingOverlay";

export type { Capture, FaceRegisterProps, FaceRegisterTranslations };

const isDev = import.meta.env.DEV;

export default function FaceRegister({
  onComplete,
  onExit,
  locale,
  translations,
  enableDebug: _enableDebug = true,
}: FaceRegisterProps) {
  const { videoRef, canvasRef, streamRef, videoDims, startCamera, stopCamera } = useCamera();
  const { loading, loadModels } = useFaceModels();
  const { startRecording, stopRecording } = useFaceRecorder();
  const { process } = usePostProcess();

  const svgDims = videoDims
    ? getSvgDims(videoDims.w, videoDims.h)
    : { svgWidth: SVG_WIDTH, svgHeight: 600, ovalCx: OVAL_CX };

  const [screen, setScreen] = useState<Screen>("intro");
  const [captures, setCaptures] = useState<Capture[]>([]);

  const recordingRef = useRef(false);
  const completingRef = useRef(false);

  const bundle = useMemo(() => resolveTranslations(locale, translations), [locale, translations]);

  useEffect(() => {
    injectStyles();
  }, []);

  /* ── post-process the recorded motion, then route to result or retry ── */
  const finishRecording = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    recordingRef.current = false;

    const blob = await stopRecording();
    stopCamera();
    setScreen("processing");

    let result: Awaited<ReturnType<typeof process>>;
    try {
      result = await process(blob);
    } catch (error) {
      if (isDev) console.error("[FaceReg] post-process failed, showing retry:", error);
      setCaptures([]);
      setScreen("retry");
      return;
    }

    const { captures: selected, missingSteps } = result;

    if (missingSteps.length > 0) {
      if (isDev) console.log("[FaceReg] missing steps, showing retry:", missingSteps);
      setCaptures([]);
      setScreen("retry");
      return;
    }

    setCaptures(selected);
    setScreen("result");
  }, [stopRecording, stopCamera, process]);

  const { coveredSteps, nosePos, maskWarning } = useCaptureCoverage({
    videoRef,
    active: screen === "capture",
    onComplete: finishRecording,
  });

  /* ── enter capture: start camera + recording ── */
  const startCapture = useCallback(() => {
    completingRef.current = false;
    setCaptures([]);
    setScreen("capture");
  }, []);

  const handleStart = useCallback(async () => {
    await loadModels();
    startCapture();
  }, [loadModels, startCapture]);

  useEffect(() => {
    if (screen !== "capture") return;
    let cancelled = false;

    const init = async () => {
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled) return;
      await startCamera();
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled || !streamRef.current) return;
      startRecording(streamRef.current);
      recordingRef.current = true;
    };
    init();

    return () => {
      cancelled = true;
    };
  }, [screen, startCamera, startRecording, streamRef]);

  /* ── reset / abort back to intro ── */
  const handleReset = useCallback(async () => {
    if (recordingRef.current) await stopRecording();
    completingRef.current = false;
    recordingRef.current = false;
    stopCamera();
    setCaptures([]);
    setScreen("intro");
  }, [stopRecording, stopCamera]);

  const handleSave = useCallback(() => {
    if (onComplete) {
      onComplete(captures);
    } else if (isDev) {
      console.log("Face registration captures:", captures);
    }
  }, [captures, onComplete]);

  return (
    <TranslationProvider value={bundle}>
      <div style={S.root}>
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {loading && <LoadingOverlay />}

        {screen === "intro" && <IntroScreen onStart={handleStart} onExit={onExit} />}

        {screen === "capture" && (
          <CaptureScreen
            videoRef={videoRef}
            coveredSteps={coveredSteps}
            nosePos={nosePos}
            maskWarning={maskWarning}
            onBack={handleReset}
            svgWidth={svgDims.svgWidth}
            ovalCx={svgDims.ovalCx}
          />
        )}

        {screen === "processing" && <ProcessingScreen />}

        {screen === "retry" && <RetryScreen onRetry={startCapture} onExit={onExit} />}

        {screen === "result" && (
          <ResultScreen
            captures={captures}
            onReset={handleReset}
            onSave={handleSave}
            onExit={onExit}
          />
        )}
      </div>
    </TranslationProvider>
  );
}
