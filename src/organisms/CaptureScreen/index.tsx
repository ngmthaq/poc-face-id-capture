import { STEPS } from "../../shared/constants/steps";
import type { StepName } from "../../shared/types/steps";
import { useTranslate } from "../../shared/translations";
import { S } from "../../shared/styles/faceRegister";
import ProgressRing from "../../molecules/ProgressRing";

interface CaptureScreenProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  coveredSteps: Set<StepName>;
  nosePos: { x: number; y: number } | null;
  maskWarning: boolean;
  complete: boolean;
  onBack?: () => void;
  svgWidth: number;
  cx: number;
}

export default function CaptureScreen({
  videoRef,
  coveredSteps,
  nosePos,
  maskWarning,
  complete,
  onBack,
  svgWidth,
  cx,
}: CaptureScreenProps) {
  const { t } = useTranslate();

  const nextStep = STEPS.find((s) => !coveredSteps.has(s.name)) ?? null;

  return (
    <div style={S.captureWrap}>
      <video ref={videoRef} playsInline muted style={S.video} />
      <ProgressRing
        coveredSteps={coveredSteps}
        nextStep={nextStep?.name ?? null}
        nosePos={nosePos}
        complete={complete}
        svgWidth={svgWidth}
        cx={cx}
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
          {maskWarning
            ? t("faceRegister.maskWarning")
            : nextStep
              ? t(nextStep.instructionKey)
              : t("faceRegister.recordingInstruction")}
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
