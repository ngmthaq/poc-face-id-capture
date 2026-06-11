import { ACCENT, IDLE_STROKE } from "../../shared/constants/theme";
import { STEPS, STEP_ANGLES } from "../../shared/constants/steps";
import {
  OVAL_CY,
  OVAL_RX,
  OVAL_RY,
  SVG_HEIGHT,
  SLOT_RADIUS,
} from "../../shared/constants/geometry";
import type { StepName } from "../../shared/types/steps";
import { S } from "../../shared/styles/faceRegister";

interface ProgressRingProps {
  coveredSteps: Set<StepName>;
  nosePos: { x: number; y: number } | null;
  svgWidth: number;
  ovalCx: number;
}

/**
 * SVG ring around the capture oval. The `center` step lights the oval outline;
 * the five directional steps each get a slot on the oval edge that fills as the
 * user's circular motion passes through that pose.
 */
export default function ProgressRing({
  coveredSteps,
  nosePos,
  svgWidth,
  ovalCx,
}: ProgressRingProps) {
  const centerCovered = coveredSteps.has("center");

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={S.svgOverlay}
    >
      <ellipse
        cx={ovalCx}
        cy={OVAL_CY}
        rx={OVAL_RX}
        ry={OVAL_RY}
        fill="none"
        stroke={centerCovered ? ACCENT : IDLE_STROKE}
        strokeWidth={centerCovered ? 3 : 1.5}
        style={{
          transition: "stroke .3s ease, stroke-width .3s ease",
          filter: centerCovered ? `drop-shadow(0 0 8px ${ACCENT})` : "none",
        }}
      />

      {STEPS.map((step) => {
        const angleDeg = STEP_ANGLES[step.name];
        if (angleDeg === null) return null;
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = ovalCx + OVAL_RX * Math.cos(angleRad);
        const y = OVAL_CY + OVAL_RY * Math.sin(angleRad);
        const covered = coveredSteps.has(step.name);
        return (
          <circle
            key={step.name}
            cx={x}
            cy={y}
            r={SLOT_RADIUS}
            fill={covered ? ACCENT : "rgba(255,255,255,0.12)"}
            stroke={covered ? ACCENT : IDLE_STROKE}
            strokeWidth="1.5"
            style={{
              transition: "fill .3s ease, stroke .3s ease",
              filter: covered ? `drop-shadow(0 0 6px ${ACCENT})` : "none",
              animation: covered ? "fr-slot-pop .3s ease" : "none",
            }}
          />
        );
      })}

      {nosePos && (
        <circle
          cx={nosePos.x}
          cy={nosePos.y}
          r="5"
          fill="#ff6b6b"
          opacity={0.85}
          style={{
            filter: "drop-shadow(0 0 4px #ff6b6b)",
            transition: "cx 0.08s linear, cy 0.08s linear",
          }}
        />
      )}
    </svg>
  );
}
