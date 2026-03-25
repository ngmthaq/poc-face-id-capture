import { useRef, useState, useEffect, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Capture {
  step: string;
  label: string;
  data: string;
}

interface FaceRegisterProps {
  onComplete?: (captures: Capture[]) => void;
}

type Screen = "intro" | "capture" | "result";

interface Step {
  key: string;
  label: string;
  instruction: string;
  target: { x: number; y: number };
  check: (yaw: number, pitch: number, roll: number) => boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACCENT = "#4fffb0";
const BG = "#0b0d0f";
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

const STEPS: Step[] = [
  {
    key: "center",
    label: "Center",
    instruction: "Look straight ahead",
    target: { x: 200, y: 270 },
    check: (y, p, r) =>
      Math.abs(y) < 12 && Math.abs(p) < 12 && Math.abs(r) < 12,
  },
  {
    key: "left",
    label: "Left",
    instruction: "Turn your face to the left",
    target: { x: 120, y: 270 },
    check: (y) => y > 18,
  },
  {
    key: "right",
    label: "Right",
    instruction: "Turn your face to the right",
    target: { x: 280, y: 270 },
    check: (y) => y < -18,
  },
  {
    key: "up",
    label: "Up",
    instruction: "Tilt your face up",
    target: { x: 200, y: 165 },
    check: (_y, p) => p < -15,
  },
  {
    key: "down",
    label: "Down",
    instruction: "Tilt your face down",
    target: { x: 200, y: 375 },
    check: (_y, p) => p > 15,
  },
  {
    key: "tilt",
    label: "Tilt",
    instruction: "Tilt your head sideways",
    target: { x: 148, y: 192 },
    check: (_y, _p, r) => Math.abs(r) > 18,
  },
];

const COUNTDOWN_DURATION = 3; // seconds

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const injectStyles = () => {
  const id = "face-register-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes fr-flash {
      0%   { opacity: 0.85; }
      100% { opacity: 0; }
    }
    @keyframes fr-fadein {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fr-countdown-ring {
      from { stroke-dashoffset: 188.5; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes fr-pulse-glow {
      0%, 100% { filter: drop-shadow(0 0 6px ${ACCENT}80); }
      50%      { filter: drop-shadow(0 0 14px ${ACCENT}cc); }
    }
    @keyframes fr-check-draw {
      to { stroke-dashoffset: 0; }
    }
    @keyframes fr-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FaceRegister({ onComplete }: FaceRegisterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number>(0);
  const runDetectionRef =
    useRef<(stepIdx: number, capturesSoFar: Capture[]) => void>(null);

  const [screen, setScreen] = useState<Screen>("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [matched, setMatched] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [countdownActive, setCountdownActive] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Crosshair animation position
  const [crosshairPos, setCrosshairPos] = useState(STEPS[0].target);
  const animTargetRef = useRef(STEPS[0].target);
  const animCurrentRef = useRef(STEPS[0].target);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    injectStyles();
  }, []);

  /* ---------- smooth crosshair animation ---------- */
  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      const cur = animCurrentRef.current;
      const tgt = animTargetRef.current;
      const nx = lerp(cur.x, tgt.x, 0.08);
      const ny = lerp(cur.y, tgt.y, 0.08);
      animCurrentRef.current = { x: nx, y: ny };
      setCrosshairPos({ x: nx, y: ny });
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  /* ---------- load models ---------- */
  const loadModels = async () => {
    if (modelsLoaded) return;
    setLoadingModels(true);
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    setModelsLoaded(true);
    setLoadingModels(false);
  };

  /* ---------- camera start / stop ---------- */
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 960 },
      },
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(loopRef.current);
  };

  /* ---------- capture frame ---------- */
  const captureFrame = useCallback((): string => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  /* ---------- detection loop ---------- */
  const runDetection = useCallback(
    (stepIdx: number, capturesSoFar: Capture[]) => {
      let isMatched = false;
      let matchStart = 0;
      let cdValue = COUNTDOWN_DURATION;

      const resetMatch = () => {
        isMatched = false;
        setMatched(false);
        setCountdownActive(false);
        setCountdownValue(0);
      };

      const detect = async () => {
        if (!videoRef.current || videoRef.current.paused) return;

        const result = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.4,
            }),
          )
          .withFaceLandmarks(true);

        if (result) {
          const landmarks = result.landmarks;
          const positions = landmarks.positions;

          // Key landmarks from 68-point model
          const noseTip = positions[30];
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const jawOutline = landmarks.getJawOutline();

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

          const faceWidth = Math.abs(jawOutline[16].x - jawOutline[0].x);
          const faceHeight = Math.abs(jawOutline[8].y - positions[19].y);

          const yaw = ((noseTip.x - eyeMidX) / (faceWidth * 0.5)) * 45;
          const pitch = ((noseTip.y - eyeMidY) / faceHeight - 0.55) * 60;
          const roll =
            Math.atan2(
              rightEyeCenter.y - leftEyeCenter.y,
              rightEyeCenter.x - leftEyeCenter.x,
            ) *
            (180 / Math.PI);

          const step = STEPS[stepIdx];
          const poseOk = step.check(yaw, pitch, roll);

          if (poseOk) {
            if (!isMatched) {
              isMatched = true;
              matchStart = performance.now();
              cdValue = COUNTDOWN_DURATION;
              setMatched(true);
              setCountdownActive(true);
              setCountdownValue(COUNTDOWN_DURATION);
            }

            const elapsed = (performance.now() - matchStart) / 1000;
            const newCd = Math.max(0, COUNTDOWN_DURATION - Math.floor(elapsed));

            if (newCd !== cdValue) {
              cdValue = newCd;
              setCountdownValue(newCd);
            }

            if (elapsed >= COUNTDOWN_DURATION) {
              // Capture!
              const data = captureFrame();
              const newCapture: Capture = {
                step: step.key,
                label: step.label,
                data,
              };
              const newCaptures = [...capturesSoFar, newCapture];

              // Flash
              setFlashing(true);
              setTimeout(() => setFlashing(false), 300);

              // Reset match state
              resetMatch();

              if (stepIdx + 1 >= STEPS.length) {
                // Done
                setCaptures(newCaptures);
                setScreen("result");
                stopCamera();
                return;
              } else {
                // Next step
                const nextIdx = stepIdx + 1;
                setCurrentStep(nextIdx);
                setCaptures(newCaptures);
                animTargetRef.current = STEPS[nextIdx].target;
                // Continue loop with next step
                runDetectionRef.current?.(nextIdx, newCaptures);
                return;
              }
            }
          } else {
            if (isMatched) resetMatch();
          }
        } else {
          if (isMatched) resetMatch();
        }

        loopRef.current = requestAnimationFrame(detect);
      };

      loopRef.current = requestAnimationFrame(detect);
    },
    [captureFrame],
  );

  useEffect(() => {
    runDetectionRef.current = runDetection;
  }, [runDetection]);

  /* ---------- start flow ---------- */
  const handleStart = async () => {
    await loadModels();
    setScreen("capture");
    setCurrentStep(0);
    setCaptures([]);
    setMatched(false);
    setCountdownActive(false);
    setCountdownValue(0);
    animCurrentRef.current = STEPS[0].target;
    animTargetRef.current = STEPS[0].target;
    setCrosshairPos(STEPS[0].target);
    await startCamera();
    runDetection(0, []);
  };

  const handleRestart = () => {
    setScreen("intro");
    setCurrentStep(0);
    setCaptures([]);
  };

  const handleSave = () => {
    if (onComplete) {
      onComplete(captures);
    } else {
      console.log("Face registration captures:", captures);
    }
  };

  /* ---------- cleanup on unmount ---------- */
  useEffect(() => {
    return () => {
      stopCamera();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  const step = STEPS[currentStep] || STEPS[0];
  const cx = crosshairPos.x;
  const cy = crosshairPos.y;

  /* ---- Intro Screen ---- */
  if (screen === "intro") {
    return (
      <div
        style={{
          background: BG,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: "40px 24px",
        }}
      >
        {loadingModels && <LoadingOverlay />}

        {/* Icon */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: `${ACCENT}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.5"
          >
            <ellipse cx="12" cy="10" rx="5" ry="7" />
            <circle cx="10" cy="8.5" r="0.8" fill={ACCENT} />
            <circle cx="14" cy="8.5" r="0.8" fill={ACCENT} />
            <path d="M10.5 12.5q1.5 1 3 0" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Face Registration
        </h1>
        <p
          style={{
            color: "#888",
            fontSize: 15,
            margin: "0 0 40px",
            textAlign: "center",
            maxWidth: 300,
          }}
        >
          We need to capture your face from multiple angles for secure
          identification.
        </p>

        {/* Steps */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            marginBottom: 48,
            maxWidth: 320,
            width: "100%",
          }}
        >
          {[
            {
              n: "1",
              title: "Position your face",
              desc: "Center your face within the oval guide",
            },
            {
              n: "2",
              title: "Follow the crosshair",
              desc: "Move your head to match each target position",
            },
            {
              n: "3",
              title: "Hold steady",
              desc: "Keep still for 3 seconds at each position",
            },
          ].map((s) => (
            <div
              key={s.n}
              style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: `${ACCENT}22`,
                  color: ACCENT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {s.n}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{s.title}</div>
                <div style={{ color: "#777", fontSize: 13, marginTop: 2 }}>
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          style={{
            background: ACCENT,
            color: "#000",
            border: "none",
            borderRadius: 14,
            padding: "16px 48px",
            fontSize: 17,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "-0.01em",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: `0 0 24px ${ACCENT}44`,
          }}
          onMouseDown={(e) =>
            ((e.target as HTMLElement).style.transform = "scale(0.97)")
          }
          onMouseUp={(e) =>
            ((e.target as HTMLElement).style.transform = "scale(1)")
          }
        >
          Get Started
        </button>
      </div>
    );
  }

  /* ---- Capture Screen ---- */
  if (screen === "capture") {
    return (
      <div
        style={{
          background: "#000",
          height: "100vh",
          width: "100vw",
          position: "relative",
          overflow: "hidden",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Video feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* SVG Overlay */}
        <svg
          viewBox="0 0 400 600"
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <mask id="oval-mask">
              <rect width="400" height="600" fill="white" />
              <ellipse cx="200" cy="270" rx="110" ry="145" fill="black" />
            </mask>
          </defs>

          {/* Dark overlay outside oval */}
          <rect
            width="400"
            height="600"
            fill="rgba(11,13,15,0.72)"
            mask="url(#oval-mask)"
          />

          {/* Oval border */}
          <ellipse
            cx="200"
            cy="270"
            rx="110"
            ry="145"
            fill="none"
            stroke={matched ? ACCENT : "rgba(255,255,255,0.35)"}
            strokeWidth="2.5"
            style={{ transition: "stroke 0.3s" }}
          />

          {/* Crosshair lines */}
          <line
            x1={cx}
            y1="0"
            x2={cx}
            y2="600"
            stroke={matched ? ACCENT : "rgba(255,255,255,0.22)"}
            strokeWidth="1"
            style={{
              transition: "stroke 0.3s",
              filter: matched ? `drop-shadow(0 0 6px ${ACCENT}80)` : "none",
            }}
          />
          <line
            x1="0"
            y1={cy}
            x2="400"
            y2={cy}
            stroke={matched ? ACCENT : "rgba(255,255,255,0.22)"}
            strokeWidth="1"
            style={{
              transition: "stroke 0.3s",
              filter: matched ? `drop-shadow(0 0 6px ${ACCENT}80)` : "none",
            }}
          />

          {/* Crosshair circle at intersection */}
          <circle
            cx={cx}
            cy={cy}
            r="8"
            fill="none"
            stroke={matched ? ACCENT : "rgba(255,255,255,0.35)"}
            strokeWidth="1.5"
            style={{
              transition: "stroke 0.3s",
              filter: matched ? `drop-shadow(0 0 8px ${ACCENT}aa)` : "none",
            }}
          />
          <circle
            cx={cx}
            cy={cy}
            r="2.5"
            fill={matched ? ACCENT : "rgba(255,255,255,0.35)"}
            style={{ transition: "fill 0.3s" }}
          />

          {/* Countdown ring */}
          {countdownActive && (
            <circle
              cx={cx}
              cy={cy}
              r="30"
              fill="none"
              stroke={ACCENT}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="188.5"
              strokeDashoffset="188.5"
              style={{
                animation: `fr-countdown-ring ${COUNTDOWN_DURATION}s linear forwards`,
                filter: `drop-shadow(0 0 8px ${ACCENT}88)`,
              }}
            />
          )}

          {/* Countdown number */}
          {countdownActive && countdownValue > 0 && (
            <text
              x={cx}
              y={cy + 52}
              textAnchor="middle"
              fill={ACCENT}
              fontSize="20"
              fontWeight="700"
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            >
              {countdownValue}
            </text>
          )}
        </svg>

        {/* Top HUD */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "52px 24px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
          }}
        >
          <div
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "-0.01em",
            }}
          >
            Face Registration
          </div>
          <div
            style={{
              color: ACCENT,
              fontWeight: 700,
              fontSize: 17,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {currentStep + 1} / {STEPS.length}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "24px 24px 48px",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {step.instruction}
          </div>

          {/* Dot pips */}
          <div style={{ display: "flex", gap: 10 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background:
                    i < currentStep
                      ? ACCENT
                      : i === currentStep
                        ? matched
                          ? ACCENT
                          : "rgba(255,255,255,0.6)"
                        : "rgba(255,255,255,0.2)",
                  transition: "background 0.3s",
                  boxShadow:
                    i === currentStep && matched
                      ? `0 0 8px ${ACCENT}88`
                      : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* White flash */}
        {flashing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              animation: "fr-flash 0.3s ease-out forwards",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  }

  /* ---- Result Screen ---- */
  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#fff",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "60px 24px 40px",
      }}
    >
      {/* Check icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `${ACCENT}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke={ACCENT}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="24"
            strokeDashoffset="24"
            style={{ animation: "fr-check-draw 0.6s ease 0.2s forwards" }}
          />
        </svg>
      </div>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          margin: "0 0 6px",
          letterSpacing: "-0.02em",
          animation: "fr-fadein 0.5s ease",
        }}
      >
        Registration Complete
      </h1>
      <p
        style={{
          color: "#888",
          fontSize: 14,
          margin: "0 0 32px",
          animation: "fr-fadein 0.5s ease 0.1s both",
        }}
      >
        {captures.length} face angles captured successfully
      </p>

      {/* 3×2 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          width: "100%",
          maxWidth: 400,
          marginBottom: 40,
          animation: "fr-fadein 0.5s ease 0.2s both",
        }}
      >
        {captures.map((cap, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "3/4",
                borderRadius: 12,
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.1)",
              }}
            >
              <img
                src={cap.data}
                alt={cap.label}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>
              {cap.label}
            </span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          gap: 12,
          width: "100%",
          maxWidth: 400,
          animation: "fr-fadein 0.5s ease 0.3s both",
        }}
      >
        <button
          onClick={handleRestart}
          style={{
            flex: 1,
            padding: "14px 0",
            borderRadius: 12,
            border: "1.5px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Register Again
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            background: ACCENT,
            color: "#000",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 0 20px ${ACCENT}44`,
          }}
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}

/* ---- Loading Overlay ---- */
function LoadingOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,13,15,0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        color: "#fff",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: `3px solid rgba(255,255,255,0.1)`,
          borderTopColor: ACCENT,
          borderRadius: "50%",
          animation: "fr-spin 0.8s linear infinite",
          marginBottom: 20,
        }}
      />
      <div style={{ fontSize: 16, fontWeight: 600 }}>
        Loading face detection models…
      </div>
      <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
        This may take a moment
      </div>
    </div>
  );
}
