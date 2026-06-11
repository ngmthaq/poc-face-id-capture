import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { SVG_WIDTH, CIRCLE_CX } from "../../shared/constants/geometry";
import { ALIGN_GRACE_MS } from "../../shared/constants/recording";
import type { Capture } from "../../shared/types/capture";
import type { FaceRegisterTranslations } from "../../shared/types/translations";
import type { Screen } from "../../shared/types/screen";
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
import ResultScreen from "../../organisms/ResultScreen";
import LoadingOverlay from "../../molecules/LoadingOverlay";

const isDev = import.meta.env.DEV;

export interface FaceRegisterProps {
  onComplete?: (captures: Capture[]) => void;
  onExit?: () => void;
  locale: string;
  translations?: FaceRegisterTranslations;
  showIntroScreen?: boolean;
  showResultScreen?: boolean;
}

export default function FaceRegister({
  onComplete,
  onExit,
  locale,
  translations,
  showIntroScreen = false,
  showResultScreen = false,
}: FaceRegisterProps) {
  const { videoRef, canvasRef, streamRef, videoDims, startCamera, stopCamera } = useCamera();
  const { modelsLoaded, loading, loadModels } = useFaceModels();
  const { startRecording, stopRecording } = useFaceRecorder();
  const { process } = usePostProcess();

  const svgDims = videoDims
    ? getSvgDims(videoDims.w, videoDims.h)
    : { svgWidth: SVG_WIDTH, svgHeight: 600, cx: CIRCLE_CX };

  const [screen, setScreen] = useState<Screen>(showIntroScreen ? "intro" : "capture");
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [captureArmed, setCaptureArmed] = useState(false);

  const recordingRef = useRef(false);
  const completingRef = useRef(false);

  const bundle = useMemo(() => resolveTranslations(locale, translations), [locale, translations]);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  /* ── post-process the recorded motion, then route to result or complete ── */
  const finishRecording = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    recordingRef.current = false;

    const blob = await stopRecording();
    stopCamera();
    setScreen("processing");

    let selected: Capture[];
    try {
      const result = await process(blob);
      selected = result.captures;
    } catch (error) {
      if (isDev) console.error("[FaceReg] post-process failed:", error);
      selected = [];
    }

    setCaptures(selected);
    if (showResultScreen) {
      setScreen("result");
    } else {
      onComplete?.(selected);
    }
  }, [stopRecording, stopCamera, process, showResultScreen, onComplete]);

  const { coveredTicks, centerCovered, nosePos, maskWarning, complete } = useCaptureCoverage({
    videoRef,
    active: screen === "capture" && modelsLoaded && captureArmed,
    onComplete: finishRecording,
  });

  /* ── advance from intro to capture ── */
  const handleStart = useCallback(() => {
    setScreen("capture");
  }, []);

  /* ── restart capture (Register Again) ── */
  const startCapture = useCallback(() => {
    completingRef.current = false;
    setCaptures([]);
    setScreen("capture");
  }, []);

  useEffect(() => {
    if (screen !== "capture" || !modelsLoaded) return;
    let cancelled = false;

    const init = async () => {
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled) return;
      setCaptureArmed(false);
      await startCamera();
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled || !streamRef.current) return;
      await new Promise((r) => setTimeout(r, ALIGN_GRACE_MS));
      if (cancelled || !streamRef.current) return;
      startRecording(streamRef.current);
      recordingRef.current = true;
      setCaptureArmed(true);
    };
    init();

    return () => {
      cancelled = true;
    };
  }, [screen, modelsLoaded, startCamera, startRecording, streamRef]);

  /* ── abort and exit ── */
  const handleBack = useCallback(async () => {
    if (recordingRef.current) await stopRecording();
    completingRef.current = false;
    recordingRef.current = false;
    stopCamera();
    onExit?.();
  }, [stopRecording, stopCamera, onExit]);

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
            coveredTicks={coveredTicks}
            centerCovered={centerCovered}
            nosePos={nosePos}
            maskWarning={maskWarning}
            complete={complete}
            onBack={onExit ? handleBack : undefined}
            svgWidth={svgDims.svgWidth}
            cx={svgDims.cx}
          />
        )}

        {screen === "processing" && <ProcessingScreen />}

        {screen === "result" && (
          <ResultScreen
            captures={captures}
            onReset={startCapture}
            onSave={handleSave}
            onExit={onExit}
          />
        )}
      </div>
    </TranslationProvider>
  );
}
