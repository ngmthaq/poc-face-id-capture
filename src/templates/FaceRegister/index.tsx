import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { STEPS, SVG_WIDTH, OVAL_CX, type Screen } from "../../shared/constants/faceRegister";
import type {
  Capture,
  FaceRegisterProps,
  FaceRegisterTranslations,
} from "../../shared/types/faceRegister";
import { applyI18nConfig } from "../../shared/i18n";
import { injectStyles, S } from "../../shared/styles/faceRegister";
import { useCamera } from "../../shared/hooks/useCamera";
import { useFaceModels } from "../../shared/hooks/useFaceModels";
import { useFaceDetection } from "../../shared/hooks/useFaceDetection";
import { getSvgDims } from "../../shared/utils/faceCalculations";
import IntroScreen from "../../organisms/IntroScreen";
import CaptureScreen from "../../organisms/CaptureScreen";
import ResultScreen from "../../organisms/ResultScreen";
import LoadingOverlay from "../../molecules/LoadingOverlay";

export type { Capture, FaceRegisterProps, FaceRegisterTranslations };

export default function FaceRegister({
  onComplete,
  onExit,
  locale,
  translations,
}: FaceRegisterProps) {
  const { videoRef, canvasRef, videoDims, startCamera, stopCamera, captureFrame } = useCamera();

  const svgDims = videoDims
    ? getSvgDims(videoDims.w, videoDims.h)
    : { svgWidth: SVG_WIDTH, svgHeight: 600, ovalCx: OVAL_CX };

  const { loading, loadModels } = useFaceModels();

  const [screen, setScreen] = useState<Screen>("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [matched, setMatched] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [maskWarning, setMaskWarning] = useState(false);
  const [outsideOval, setOutsideOval] = useState(false);
  const [crosshairPos, setCrosshairPos] = useState(STEPS[0].target);
  const [nosePos, setNosePos] = useState<{ x: number; y: number } | null>(null);

  const i18nConfigRef = useRef(false);
  if (!i18nConfigRef.current) {
    applyI18nConfig(locale, translations);
    i18nConfigRef.current = true;
  }

  useLayoutEffect(() => {
    applyI18nConfig(locale, translations);
  }, [locale, translations]);

  useEffect(() => {
    injectStyles();
  }, []);

  const detectionCallbacks = useMemo(
    () => ({
      setMatched,
      setCountdownActive,
      setNosePos,
      setMaskWarning,
      setOutsideOval,
      setCaptures,
      setShowFlash,
      setCurrentStep,
      setCrosshairPos,
      setScreen,
      captureFrame,
      stopCamera,
    }),
    [captureFrame, stopCamera],
  );

  const { loopRef, runDetection } = useFaceDetection(detectionCallbacks);

  /* ── start capture flow ── */
  const handleStart = useCallback(async () => {
    await loadModels();
    setCurrentStep(0);
    setCaptures([]);
    setMatched(false);
    setCountdownActive(false);
    setCrosshairPos(STEPS[0].target);
    setScreen("capture");
  }, [loadModels]);

  /* ── kick off camera + detection once capture screen mounts ── */
  const stopDetectionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (screen !== "capture") return;
    let cancelled = false;
    const init = async () => {
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled) return;
      await startCamera();
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled) return;
      const stopFn = runDetection(0, [], videoRef);
      stopDetectionRef.current = stopFn ?? null;
    };
    init();
    return () => {
      cancelled = true;
      stopDetectionRef.current?.();
      stopDetectionRef.current = null;
    };
  }, [screen, startCamera, runDetection, videoRef]);

  /* ── reset ── */
  const handleReset = useCallback(() => {
    stopCamera();
    setScreen("intro");
    setCurrentStep(0);
    setCaptures([]);
    setMatched(false);
    setCountdownActive(false);
  }, [stopCamera]);

  /* ── save ── */
  const handleSave = useCallback(() => {
    if (onComplete) {
      onComplete(captures);
    } else if (import.meta.env.DEV) {
      console.log("Face registration captures:", captures);
    }
  }, [captures, onComplete]);

  /* ── cleanup ── */
  useEffect(() => {
    return () => {
      clearTimeout(loopRef.current);
      stopDetectionRef.current?.();
    };
  }, [loopRef]);

  return (
    <div style={S.root}>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {loading && <LoadingOverlay />}

      {screen === "intro" && <IntroScreen onStart={handleStart} onExit={onExit} />}

      {screen === "capture" && (
        <CaptureScreen
          videoRef={videoRef}
          currentStep={currentStep}
          crosshairPos={crosshairPos}
          matched={matched}
          countdownActive={countdownActive}
          nosePos={nosePos}
          showFlash={showFlash}
          outsideOval={outsideOval}
          maskWarning={maskWarning}
          onBack={handleReset}
          svgWidth={svgDims.svgWidth}
          ovalCx={svgDims.ovalCx}
        />
      )}

      {screen === "result" && (
        <ResultScreen
          captures={captures}
          onReset={handleReset}
          onSave={handleSave}
          onExit={onExit}
        />
      )}
    </div>
  );
}
