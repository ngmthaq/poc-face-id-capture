import { STEPS } from "../../shared/constants/steps";
import { TICK_COUNT } from "../../shared/constants/geometry";
import { useTranslate } from "../../shared/translations";
import { S } from "../../shared/styles/faceRegister";
import ProgressRing from "../../molecules/ProgressRing";

interface CaptureScreenProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  coveredTicks: Set<number>;
  centerCovered: boolean;
  nosePos: { x: number; y: number } | null;
  maskWarning: boolean;
  complete: boolean;
  onBack?: () => void;
  svgWidth: number;
  cx: number;
}

export default function CaptureScreen({
  videoRef,
  coveredTicks,
  centerCovered,
  nosePos,
  maskWarning,
  complete,
  onBack,
  svgWidth,
  cx,
}: CaptureScreenProps) {
  const { t } = useTranslate();

  const centerStep = STEPS.find((s) => s.name === "center");

  return (
    <div style={S.captureWrap}>
      <video ref={videoRef} playsInline muted style={S.video} />
      <ProgressRing
        coveredTicks={coveredTicks}
        centerCovered={centerCovered}
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
            current: coveredTicks.size,
            total: TICK_COUNT,
          })}
        </div>
      </div>

      {/* bottom bar */}
      <div style={S.bottomBar}>
        <div style={S.instruction}>
          {maskWarning
            ? t("faceRegister.maskWarning")
            : !centerCovered
              ? t(centerStep?.instructionKey ?? "faceRegister.stepCenter")
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
