import { STEPS } from "../../shared/constants/faceRegister";
import type { StepName } from "../../shared/types/faceRegister";
import { useTranslate } from "../../shared/translations";
import { S } from "../../shared/styles/faceRegister";
import ProgressRing from "../../molecules/ProgressRing";

interface CaptureScreenProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  coveredSteps: Set<StepName>;
  nosePos: { x: number; y: number } | null;
  maskWarning: boolean;
  onBack?: () => void;
  svgWidth: number;
  ovalCx: number;
}

export default function CaptureScreen({
  videoRef,
  coveredSteps,
  nosePos,
  maskWarning,
  onBack,
  svgWidth,
  ovalCx,
}: CaptureScreenProps) {
  const { t } = useTranslate();

  return (
    <div style={S.captureWrap}>
      <video ref={videoRef} playsInline muted style={S.video} />
      <ProgressRing
        coveredSteps={coveredSteps}
        nosePos={nosePos}
        svgWidth={svgWidth}
        ovalCx={ovalCx}
      />

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
            current: coveredSteps.size,
            total: STEPS.length,
          })}
        </div>
      </div>

      {/* bottom bar */}
      <div style={S.bottomBar}>
        <div style={S.instruction}>
          {maskWarning ? t("faceRegister.maskWarning") : t("faceRegister.recordingInstruction")}
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
      </div>
    </div>
  );
}
