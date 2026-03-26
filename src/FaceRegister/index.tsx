import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  STEPS,
  type Screen,
  type Capture,
  type FaceRegisterProps,
} from "./constants";
import { injectStyles } from "./styles";
import { S } from "./styles";
import { useCamera } from "./hooks/useCamera";
import { useFaceModels } from "./hooks/useFaceModels";
import { useFaceDetection } from "./hooks/useFaceDetection";
import IntroScreen from "./components/IntroScreen";
import CaptureScreen from "./components/CaptureScreen";
import ResultScreen from "./components/ResultScreen";
import LoadingOverlay from "./components/LoadingOverlay";

export type { Capture, FaceRegisterProps };

export default function FaceRegister({ onComplete }: FaceRegisterProps) {
  const { videoRef, canvasRef, startCamera, stopCamera, captureFrame } =
    useCamera();

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
  const [nosePos, setNosePos] = useState<{ x: number; y: number } | null>(
    null,
  );

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
    } else {
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

      {screen === "intro" && <IntroScreen onStart={handleStart} />}

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
        />
      )}

      {screen === "result" && (
        <ResultScreen
          captures={captures}
          onReset={handleReset}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
