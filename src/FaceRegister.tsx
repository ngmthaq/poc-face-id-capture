import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
import * as faceapi from "@vladmandic/face-api";

/* ────────────────────── types ────────────────────── */

type StepName = "center" | "left" | "right" | "up" | "down" | "tilt";
type Screen = "intro" | "capture" | "result";

interface Capture {
  step: StepName;
  label: string;
  data: string;
}

interface StepDef {
  name: StepName;
  label: string;
  instruction: string;
  target: { x: number; y: number };
  check: (yaw: number, pitch: number, roll: number) => boolean;
  countdown?: number;
}

interface Props {
  onComplete?: (captures: Capture[]) => void;
}

/* ────────────────────── constants ────────────────── */

const STEPS: StepDef[] = [
  {
    name: "center",
    label: "Center",
    instruction: "Look straight ahead",
    target: { x: 200, y: 300 },
    check: (y, p, r) =>
      Math.abs(y) < 12 && Math.abs(p) < 12 && Math.abs(r) < 12,
  },
  {
    name: "left",
    label: "Left",
    instruction: "Turn your face left",
    target: { x: 120, y: 300 },
    check: (y) => y > 12,
  },
  {
    name: "right",
    label: "Right",
    instruction: "Turn your face right",
    target: { x: 280, y: 300 },
    check: (y) => y < -12,
  },
  {
    name: "up",
    label: "Up",
    instruction: "Tilt your face up",
    target: { x: 200, y: 230 },
    check: (_y, p) => p < -10,
  },
  {
    name: "down",
    label: "Down",
    instruction: "Tilt your face down",
    target: { x: 200, y: 380 },
    check: (_y, p) => p > 6,
  },
  {
    name: "tilt",
    label: "Tilt",
    instruction: "Tilt your head sideways",
    target: { x: 148, y: 250 },
    check: (_y, _p, r) => Math.abs(r) > 5,
    countdown: 1500,
  },
];

const ACCENT = "#4fffb0";
const BG = "#0b0d0f";
const COUNTDOWN_MS = 2000;
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

/* ────────────────────── styles ───────────────────── */

const injectStyles = () => {
  const id = "face-register-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes fr-pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
    @keyframes fr-flash { 0%{opacity:.85} 100%{opacity:0} }
    @keyframes fr-countdown-ring {
      from { stroke-dashoffset: 188.5; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes fr-fade-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fr-scale-in { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
    @keyframes fr-checkmark {
      0%   { stroke-dashoffset: 56; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes fr-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
};

const S: Record<string, CSSProperties> = {
  root: {
    position: "fixed",
    inset: 0,
    background: BG,
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif',
    color: "#fff",
    overflow: "hidden",
    userSelect: "none",
    WebkitUserSelect: "none",
  },

  /* intro */
  intro: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "0 32px",
    textAlign: "center",
    animation: "fr-fade-in .5s ease",
  },
  introIcon: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    border: `2px solid ${ACCENT}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    marginBottom: 8,
  },
  introSub: { fontSize: 15, color: "rgba(255,255,255,.5)", marginBottom: 40 },
  introSteps: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    width: "100%",
    maxWidth: 320,
    marginBottom: 48,
    textAlign: "left",
  },
  introStep: { display: "flex", alignItems: "center", gap: 14 },
  introStepNum: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(79,255,176,.1)",
    color: ACCENT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
    flexShrink: 0,
  },
  introStepText: {
    fontSize: 15,
    color: "rgba(255,255,255,.75)",
    lineHeight: 1.4,
  },
  btn: {
    padding: "16px 48px",
    borderRadius: 14,
    border: "none",
    background: ACCENT,
    color: BG,
    fontSize: 17,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.01em",
  },
  btnOutline: {
    padding: "14px 32px",
    borderRadius: 14,
    border: `1.5px solid rgba(255,255,255,.15)`,
    background: "transparent",
    color: "#fff",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },

  /* capture */
  captureWrap: { position: "relative", width: "100%", height: "100%" },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    transform: "scaleX(-1)",
    background: BG,
  },
  svgOverlay: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "52px 24px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  },
  hudTitle: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" },
  hudProgress: { fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,.6)" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "0 24px 48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    zIndex: 5,
  },
  instruction: { fontSize: 17, fontWeight: 500, textAlign: "center" },
  dots: { display: "flex", gap: 8 },
  flash: {
    position: "absolute",
    inset: 0,
    background: "#fff",
    pointerEvents: "none",
    animation: "fr-flash .35s ease-out forwards",
    zIndex: 10,
  },

  /* result */
  result: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    padding: "60px 24px 40px",
    overflowY: "auto",
    animation: "fr-fade-in .5s ease",
  },
  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: `rgba(79,255,176,.12)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    marginBottom: 6,
  },
  resultSub: { fontSize: 14, color: "rgba(255,255,255,.45)", marginBottom: 32 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 12,
    width: "100%",
    maxWidth: 380,
    marginBottom: 40,
  },
  gridItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  gridImg: {
    width: "100%",
    aspectRatio: "3/4",
    objectFit: "cover",
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,.08)",
    transform: "scaleX(-1)",
  },
  gridLabel: { fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.45)" },
  resultBtns: { display: "flex", gap: 12, width: "100%", maxWidth: 380 },

  /* loading */
  loadingOverlay: {
    position: "fixed",
    inset: 0,
    background: BG,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  spinner: {
    width: 44,
    height: 44,
    border: "3px solid rgba(255,255,255,.1)",
    borderTopColor: ACCENT,
    borderRadius: "50%",
    animation: "fr-spin .8s linear infinite",
    marginBottom: 20,
  },
};

/* ────────────────────── component ────────────────── */

export default function FaceRegister({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number>(0);
  const countdownStart = useRef<number>(0);

  const [screen, setScreen] = useState<Screen>("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [matched, setMatched] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);
  const [showFlash, setShowFlash] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // crosshair animation
  const [crosshairPos, setCrosshairPos] = useState(STEPS[0].target);
  // nose tracking dot (SVG coords)
  const [nosePos, setNosePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const prevStepRef = useRef(0);

  useEffect(() => {
    injectStyles();
  }, []);

  /* ── load models ── */
  const loadModels = useCallback(async () => {
    if (modelsLoaded) return;
    setLoading(true);
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    setModelsLoaded(true);
    setLoading(false);
  }, [modelsLoaded]);

  /* ── start camera ── */
  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 720 },
        height: { ideal: 1280 },
      },
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }, []);

  /* ── stop camera ── */
  const stopCamera = useCallback(() => {
    clearTimeout(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /* ── capture frame ── */
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

  /* ── detection loop ── */
  const runDetection = useCallback(
    (stepIdx: number, capturesSoFar: Capture[]) => {
      const step = STEPS[stepIdx];
      if (!step) return;
      const stepCountdown = step.countdown ?? COUNTDOWN_MS;

      let isMatched = false;
      let cdStart = 0;
      let lastCdNum = 3;
      let missCount = 0;
      const MISS_GRACE = 3; // allow a few missed frames before resetting
      let stopped = false;

      const detect = async () => {
        if (stopped) return;
        const video = videoRef.current;
        if (!video || video.paused || video.ended) {
          // retry — video might not be ready yet
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
            const leftEye = lm.getLeftEye();
            const rightEye = lm.getRightEye();
            const leftEyeCenter = {
              x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length,
              y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length,
            };
            const rightEyeCenter = {
              x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length,
              y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length,
            };
            const eyeMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
            const eyeMidY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
            const jaw = lm.getJawOutline();
            const faceWidth = Math.abs(jaw[jaw.length - 1].x - jaw[0].x);
            const faceHeight = Math.abs(positions[8].y - positions[19].y);

            const yaw = ((noseTip.x - eyeMidX) / (faceWidth * 0.5)) * 45;
            const pitch =
              ((noseTip.y - eyeMidY) / faceHeight - 0.21) * 80;
            const roll =
              Math.atan2(
                rightEyeCenter.y - leftEyeCenter.y,
                rightEyeCenter.x - leftEyeCenter.x,
              ) *
              (180 / Math.PI);

            console.log(
              `[FaceReg] step=${step.name} yaw=${yaw.toFixed(1)} pitch=${pitch.toFixed(1)} roll=${roll.toFixed(1)}`,
            );

            // map nose tip from video pixels to SVG viewBox (400x600)
            // video is mirrored so flip x
            const vw = video.videoWidth || 1;
            const vh = video.videoHeight || 1;
            setNosePos({
              x: (1 - noseTip.x / vw) * 400,
              y: (noseTip.y / vh) * 600,
            });

            const passes = step.check(yaw, pitch, roll);

            if (passes) {
              missCount = 0;
              if (!isMatched) {
                isMatched = true;
                cdStart = performance.now();
                lastCdNum = 3;
                setMatched(true);
                setCountdownActive(true);
                setCountdownNum(3);
                countdownStart.current = cdStart;
              }
              const elapsed = performance.now() - cdStart;
              const remaining = Math.ceil((stepCountdown - elapsed) / 1000);
              const clampedNum = Math.max(1, Math.min(3, remaining));
              if (clampedNum !== lastCdNum) {
                lastCdNum = clampedNum;
                setCountdownNum(clampedNum);
              }

              if (elapsed >= stepCountdown) {
                stopped = true;
                const data = captureFrame();
                const newCapture: Capture = {
                  step: step.name,
                  label: step.label,
                  data,
                };
                const updatedCaptures = [...capturesSoFar, newCapture];
                setCaptures(updatedCaptures);
                setShowFlash(true);
                setTimeout(() => setShowFlash(false), 350);
                setMatched(false);
                setCountdownActive(false);

                const nextIdx = stepIdx + 1;
                if (nextIdx >= STEPS.length) {
                  stopCamera();
                  setScreen("result");
                  return;
                }
                setCurrentStep(nextIdx);
                setCrosshairPos(STEPS[nextIdx].target);
                setTimeout(
                  () => runDetection(nextIdx, updatedCaptures),
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
                setMatched(false);
                setCountdownActive(false);
                setCountdownNum(3);
              }
            }
          } else {
            setNosePos(null);
            missCount++;
            if (isMatched && missCount >= MISS_GRACE) {
              isMatched = false;
              cdStart = 0;
              missCount = 0;
              setMatched(false);
              setCountdownActive(false);
              setCountdownNum(3);
            }
          }
        } catch (err) {
          console.warn("[FaceReg] detection error:", err);
        }

        if (!stopped) {
          // use setTimeout instead of rAF — detection is slow, no need for 60fps
          loopRef.current = window.setTimeout(detect, 100);
        }
      };

      loopRef.current = window.setTimeout(detect, 100);

      // expose stop handle so cleanup can halt the loop
      return () => {
        stopped = true;
        clearTimeout(loopRef.current);
      };
    },
    [captureFrame, stopCamera],
  );

  /* ── start capture flow ── */
  const handleStart = useCallback(async () => {
    await loadModels();
    setCurrentStep(0);
    setCaptures([]);
    setMatched(false);
    setCountdownActive(false);
    setCrosshairPos(STEPS[0].target);
    prevStepRef.current = 0;
    setScreen("capture");
  }, [loadModels]);

  /* ── kick off camera + detection once capture screen mounts ── */
  const stopDetectionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (screen !== "capture") return;
    let cancelled = false;
    const init = async () => {
      // wait a frame so the <video> element is in the DOM
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled) return;
      await startCamera();
      if (cancelled) return;
      // small extra delay for the video to produce frames
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled) return;
      const stopFn = runDetection(0, []);
      stopDetectionRef.current = stopFn ?? null;
    };
    init();
    return () => {
      cancelled = true;
      stopDetectionRef.current?.();
      stopDetectionRef.current = null;
    };
  }, [screen, startCamera, runDetection]);

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
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ── SVG overlay ── */
  const step = STEPS[currentStep] ?? STEPS[0];
  const tx = crosshairPos.x;
  const ty = crosshairPos.y;
  const crossColor = matched ? ACCENT : "rgba(255,255,255,0.22)";
  const crossGlow = matched ? `drop-shadow(0 0 8px ${ACCENT})` : "none";

  const renderOverlay = () => (
    <svg
      viewBox="0 0 400 600"
      preserveAspectRatio="xMidYMid meet"
      style={S.svgOverlay}
    >
      <defs>
        <mask id="oval-mask">
          <rect width="400" height="600" fill="white" />
          <ellipse cx="200" cy="270" rx="110" ry="145" fill="black" />
        </mask>
      </defs>

      {/* dark overlay outside oval */}
      <rect
        width="400"
        height="600"
        fill="rgba(11,13,15,0.72)"
        mask="url(#oval-mask)"
      />

      {/* oval border */}
      <ellipse
        cx="200"
        cy="270"
        rx="110"
        ry="145"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />

      {/* crosshair lines */}
      <line
        x1={tx}
        y1="0"
        x2={tx}
        y2="600"
        stroke={crossColor}
        strokeWidth="1.2"
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />
      <line
        x1="0"
        y1={ty}
        x2="400"
        y2={ty}
        stroke={crossColor}
        strokeWidth="1.2"
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />

      {/* crosshair center — outer ring */}
      <circle
        cx={tx}
        cy={ty}
        r="20"
        fill="none"
        stroke={crossColor}
        strokeWidth="1.8"
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />
      {/* crosshair center — inner ring */}
      <circle
        cx={tx}
        cy={ty}
        r="10"
        fill="none"
        stroke={crossColor}
        strokeWidth="1.2"
        opacity={0.5}
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />
      {/* crosshair center — dot */}
      <circle
        cx={tx}
        cy={ty}
        r="4"
        fill={crossColor}
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />

      {/* countdown ring */}
      {countdownActive && (
        <circle
          cx={tx}
          cy={ty}
          r="30"
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeDasharray="188.5"
          strokeDashoffset="188.5"
          strokeLinecap="round"
          style={{
            animation: `fr-countdown-ring ${(STEPS[currentStep]?.countdown ?? COUNTDOWN_MS)}ms linear forwards`,
            filter: `drop-shadow(0 0 6px ${ACCENT})`,
          }}
          transform={`rotate(-90 ${tx} ${ty})`}
        />
      )}

      {/* nose tracking dot */}
      {nosePos && (
        <circle
          cx={nosePos.x}
          cy={nosePos.y}
          r="5"
          fill={matched ? ACCENT : "#ff6b6b"}
          opacity={0.85}
          style={{
            filter: `drop-shadow(0 0 4px ${matched ? ACCENT : "#ff6b6b"})`,
            transition: "cx 0.08s linear, cy 0.08s linear",
          }}
        />
      )}
    </svg>
  );

  /* ── render screens ── */
  return (
    <div style={S.root}>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* loading overlay */}
      {loading && (
        <div style={S.loadingOverlay}>
          <div style={S.spinner} />
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "rgba(255,255,255,.6)",
            }}
          >
            Loading face detection models…
          </div>
        </div>
      )}

      {/* ── INTRO ── */}
      {screen === "intro" && (
        <div style={S.intro}>
          <div style={S.introIcon}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={ACCENT}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 3H5a2 2 0 0 0-2 2v4" />
              <path d="M15 3h4a2 2 0 0 1 2 2v4" />
              <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
              <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
              <circle cx="12" cy="10" r="3" />
              <path d="M12 13c-2.5 0-5 1.3-5 4v1h10v-1c0-2.7-2.5-4-5-4z" />
            </svg>
          </div>
          <div style={S.introTitle}>Face Registration</div>
          <div style={S.introSub}>
            Set up your face profile for identification
          </div>
          <div style={S.introSteps}>
            <div style={S.introStep}>
              <div style={S.introStepNum}>1</div>
              <div style={S.introStepText}>
                Position your face within the oval frame
              </div>
            </div>
            <div style={S.introStep}>
              <div style={S.introStepNum}>2</div>
              <div style={S.introStepText}>
                Follow the crosshair by moving your head
              </div>
            </div>
            <div style={S.introStep}>
              <div style={S.introStepNum}>3</div>
              <div style={S.introStepText}>
                Hold still during the countdown to capture
              </div>
            </div>
          </div>
          <button style={S.btn} onClick={handleStart}>
            Get Started
          </button>
        </div>
      )}

      {/* ── CAPTURE ── */}
      {screen === "capture" && (
        <div style={S.captureWrap}>
          <video ref={videoRef} playsInline muted style={S.video} />
          {renderOverlay()}
          {showFlash && <div style={S.flash} />}

          {/* HUD top */}
          <div style={S.hud}>
            <div style={S.hudTitle}>Face Registration</div>
            <div style={S.hudProgress}>{currentStep + 1} / 6</div>
          </div>

          {/* countdown number */}
          {countdownActive && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 6,
                fontSize: 48,
                fontWeight: 700,
                color: ACCENT,
                textShadow: `0 0 20px ${ACCENT}`,
                animation: "fr-pulse .6s ease infinite",
              }}
            >
              {countdownNum}
            </div>
          )}

          {/* bottom bar */}
          <div style={S.bottomBar}>
            <div style={S.instruction}>{step.instruction}</div>
            <div style={S.dots}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background:
                      i < currentStep
                        ? ACCENT
                        : i === currentStep
                          ? "#fff"
                          : "rgba(255,255,255,.2)",
                    transition: "background .3s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {screen === "result" && (
        <div style={S.result}>
          <div style={S.resultIcon}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="16" stroke={ACCENT} strokeWidth="2" />
              <path
                d="M11 18.5L16 23.5L25 13.5"
                stroke={ACCENT}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="56"
                style={{ animation: "fr-checkmark .6s ease forwards" }}
              />
            </svg>
          </div>
          <div style={S.resultTitle}>Registration Complete</div>
          <div style={S.resultSub}>6 face images captured successfully</div>
          <div style={S.grid}>
            {captures.map((c) => (
              <div key={c.step} style={S.gridItem}>
                <img src={c.data} alt={c.label} style={S.gridImg} />
                <span style={S.gridLabel}>{c.label}</span>
              </div>
            ))}
          </div>
          <div style={S.resultBtns}>
            <button style={{ ...S.btnOutline, flex: 1 }} onClick={handleReset}>
              Register Again
            </button>
            <button style={{ ...S.btn, flex: 1 }} onClick={handleSave}>
              Save &amp; Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
