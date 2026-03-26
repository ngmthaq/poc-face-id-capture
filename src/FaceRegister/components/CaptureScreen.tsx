import { useTranslation } from "react-i18next";
import { ACCENT, STEPS } from "../constants";
import { S } from "../styles";
import SvgOverlay from "./SvgOverlay";

interface CaptureScreenProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentStep: number;
  crosshairPos: { x: number; y: number };
  matched: boolean;
  countdownActive: boolean;
  nosePos: { x: number; y: number } | null;
  showFlash: boolean;
  outsideOval: boolean;
  maskWarning: boolean;
  onBack?: () => void;
  svgWidth: number;
  ovalCx: number;
}

export default function CaptureScreen({
  videoRef,
  currentStep,
  crosshairPos,
  matched,
  countdownActive,
  nosePos,
  showFlash,
  outsideOval,
  maskWarning,
  onBack,
  svgWidth,
  ovalCx,
}: CaptureScreenProps) {
  const { t } = useTranslation();
  const step = STEPS[currentStep] ?? STEPS[0];

  return (
    <div style={S.captureWrap}>
      <video ref={videoRef} playsInline muted style={S.video} />
      <SvgOverlay
        currentStep={currentStep}
        crosshairPos={crosshairPos}
        matched={matched}
        countdownActive={countdownActive}
        nosePos={nosePos}
        svgWidth={svgWidth}
        ovalCx={ovalCx}
      />
      {showFlash && <div style={S.flash} />}

      {/* HUD top */}
      <div style={S.hud}>
        {onBack && (
          <button style={S.captureBackBtn} onClick={onBack}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div style={S.hudTitle}>{t("faceRegister.hudTitle")}</div>
        <div style={S.hudProgress}>
          {t("faceRegister.hudProgress", {
            current: currentStep + 1,
            total: STEPS.length,
          })}
        </div>
      </div>

      {/* bottom bar */}
      <div style={S.bottomBar}>
        <div style={S.instruction}>
          {outsideOval
            ? t("faceRegister.outsideOval")
            : maskWarning
              ? t("faceRegister.maskWarning")
              : t(step.instructionKey)}
        </div>
        {maskWarning && (
          <div
            style={{
              fontSize: 13,
              color: "#ff6b6b",
              fontWeight: 500,
              marginTop: 4,
            }}
          >
            {t("faceRegister.maskWarningDetail")}
          </div>
        )}
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
  );
}
