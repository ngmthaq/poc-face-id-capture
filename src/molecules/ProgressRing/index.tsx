import { IDLE_STROKE, TICK_ACTIVE } from "../../shared/constants/theme";
import {
  CIRCLE_CY,
  CIRCLE_R,
  SVG_HEIGHT,
  TICK_COUNT,
  TICK_GAP,
  TICK_LENGTH,
  TICK_WIDTH,
} from "../../shared/constants/geometry";
import { S } from "../../shared/styles/faceRegister";

const NEXT_STROKE = "rgba(255,255,255,0.55)";

interface ProgressRingProps {
  coveredTicks: Set<number>;
  centerCovered: boolean;
  nosePos: { x: number; y: number } | null;
  complete: boolean;
  svgWidth: number;
  cx: number;
}

/**
 * SVG ring around the capture circle. The `center` alignment gate lights the
 * circle outline; each of the 30 radial ticks turns green when the head's
 * continuous sweep points in that tick's direction. A dim mask darkens
 * everything outside the circle.
 */
export default function ProgressRing({
  coveredTicks,
  centerCovered,
  nosePos,
  complete,
  svgWidth,
  cx,
}: ProgressRingProps) {
  const outlineCovered = complete || centerCovered;
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
        stroke={outlineCovered ? TICK_ACTIVE : NEXT_STROKE}
        strokeWidth={outlineCovered ? 3 : 1.5}
        style={{
          transition: "stroke .3s ease, stroke-width .3s ease",
          filter: outlineCovered ? `drop-shadow(0 0 8px ${TICK_ACTIVE})` : "none",
          animation: outlineCovered ? "none" : "fr-pulse 1s ease-in-out infinite",
        }}
      />

      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const angle = (360 / TICK_COUNT) * i;
        const angleRad = (angle * Math.PI) / 180;
        const inner = CIRCLE_R + TICK_GAP;
        const outer = inner + TICK_LENGTH;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const showCovered = complete || coveredTicks.has(i);
        return (
          <line
            key={i}
            x1={cx + inner * cos}
            y1={CIRCLE_CY + inner * sin}
            x2={cx + outer * cos}
            y2={CIRCLE_CY + outer * sin}
            stroke={showCovered ? TICK_ACTIVE : IDLE_STROKE}
            strokeWidth={TICK_WIDTH}
            strokeLinecap="round"
            style={{
              transition: "stroke .3s ease",
              filter: showCovered ? `drop-shadow(0 0 6px ${TICK_ACTIVE})` : "none",
              animation: showCovered ? "fr-slot-pop .3s ease" : "none",
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
