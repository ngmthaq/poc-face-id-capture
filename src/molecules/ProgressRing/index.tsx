import { useMemo } from "react";
import { IDLE_STROKE, TICK_ACTIVE } from "../../shared/constants/theme";
import { STEP_ANGLES } from "../../shared/constants/steps";
import {
  CIRCLE_CY,
  CIRCLE_R,
  SVG_HEIGHT,
  TICK_COUNT,
  TICK_GAP,
  TICK_LENGTH,
  TICK_WIDTH,
} from "../../shared/constants/geometry";
import type { StepName } from "../../shared/types/steps";
import { S } from "../../shared/styles/faceRegister";

const NEXT_STROKE = "rgba(255,255,255,0.55)";

interface ProgressRingProps {
  coveredSteps: Set<StepName>;
  nextStep: StepName | null;
  nosePos: { x: number; y: number } | null;
  complete: boolean;
  svgWidth: number;
  cx: number;
}

/* Smallest signed angular difference between two degree values, normalized to [-180, 180]. */
function angularDistance(a: number, b: number): number {
  let diff = ((a - b + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  return Math.abs(diff);
}

/**
 * SVG ring around the capture circle. The `center` step lights the circle outline;
 * the five directional steps each own a band of radial ticks that turn green as the
 * user's circular motion passes through that pose. A dim mask darkens everything
 * outside the circle.
 */
export default function ProgressRing({
  coveredSteps,
  nextStep,
  nosePos,
  complete,
  svgWidth,
  cx,
}: ProgressRingProps) {
  const centerCovered = coveredSteps.has("center");
  const centerIsNext = !complete && nextStep === "center" && !centerCovered;
  const outlineCovered = complete || centerCovered;

  /* Assign each evenly-spaced tick to the directional step whose angle is angularly nearest. */
  const tickSteps = useMemo(() => {
    const directional = (Object.entries(STEP_ANGLES) as [StepName, number | null][]).filter(
      (entry): entry is [StepName, number] => entry[1] !== null,
    );
    return Array.from({ length: TICK_COUNT }, (_, i) => {
      const tickAngle = (360 / TICK_COUNT) * i;
      let nearest = directional[0][0];
      let best = Infinity;
      for (const [name, angle] of directional) {
        const dist = angularDistance(tickAngle, angle);
        if (dist < best) {
          best = dist;
          nearest = name;
        }
      }
      return { angle: tickAngle, stepName: nearest };
    });
  }, []);

  const maskId = "fr-circle-mask";

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={S.svgOverlay}
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width={svgWidth} height={SVG_HEIGHT} fill="white" />
          <circle cx={cx} cy={CIRCLE_CY} r={CIRCLE_R} fill="black" />
        </mask>
      </defs>

      <rect
        x="0"
        y="0"
        width={svgWidth}
        height={SVG_HEIGHT}
        fill="rgba(0,0,0,0.5)"
        mask={`url(#${maskId})`}
      />

      <circle
        cx={cx}
        cy={CIRCLE_CY}
        r={CIRCLE_R}
        fill="none"
        stroke={outlineCovered ? TICK_ACTIVE : centerIsNext ? NEXT_STROKE : IDLE_STROKE}
        strokeWidth={outlineCovered ? 3 : 1.5}
        style={{
          transition: "stroke .3s ease, stroke-width .3s ease",
          filter: outlineCovered ? `drop-shadow(0 0 8px ${TICK_ACTIVE})` : "none",
          animation: centerIsNext ? "fr-pulse 1s ease-in-out infinite" : "none",
        }}
      />

      {tickSteps.map(({ angle, stepName }, i) => {
        const angleRad = (angle * Math.PI) / 180;
        const inner = CIRCLE_R + TICK_GAP;
        const outer = inner + TICK_LENGTH;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const showCovered = complete || coveredSteps.has(stepName);
        const isNext = !complete && !showCovered && stepName === nextStep;
        return (
          <line
            key={i}
            x1={cx + inner * cos}
            y1={CIRCLE_CY + inner * sin}
            x2={cx + outer * cos}
            y2={CIRCLE_CY + outer * sin}
            stroke={showCovered ? TICK_ACTIVE : isNext ? NEXT_STROKE : IDLE_STROKE}
            strokeWidth={TICK_WIDTH}
            strokeLinecap="round"
            style={{
              transition: "stroke .3s ease",
              filter: showCovered ? `drop-shadow(0 0 6px ${TICK_ACTIVE})` : "none",
              animation: showCovered
                ? "fr-slot-pop .3s ease"
                : isNext
                  ? "fr-pulse 1s ease-in-out infinite"
                  : "none",
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
