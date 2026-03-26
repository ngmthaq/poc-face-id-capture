import {
  ACCENT,
  STEPS,
  COUNTDOWN_MS,
  OVAL_CY,
  OVAL_RX,
  OVAL_RY,
  SVG_HEIGHT,
} from "../constants";
import { getCurveOffsets } from "../utils/curveOffsets";
import { S } from "../styles";

interface SvgOverlayProps {
  currentStep: number;
  crosshairPos: { x: number; y: number };
  matched: boolean;
  countdownActive: boolean;
  nosePos: { x: number; y: number } | null;
  svgWidth: number;
  ovalCx: number;
}

export default function SvgOverlay({
  currentStep,
  crosshairPos,
  matched,
  countdownActive,
  nosePos,
  svgWidth,
  ovalCx,
}: SvgOverlayProps) {
  const step = STEPS[currentStep] ?? STEPS[0];
  // Offset crosshair x from the original 400-wide coordinate system to the dynamic one
  const xOffset = (svgWidth - 400) / 2;
  const tx = crosshairPos.x + xOffset;
  const ty = crosshairPos.y;
  const crossColor = matched ? ACCENT : "rgba(255,255,255,0.22)";
  const crossGlow = matched ? `drop-shadow(0 0 8px ${ACCENT})` : "none";
  const { vCurve, hCurve } = getCurveOffsets(step.name);

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={S.svgOverlay}
    >
      <defs>
        <mask id="oval-mask">
          <rect width={svgWidth} height={SVG_HEIGHT} fill="white" />
          <ellipse
            cx={ovalCx}
            cy={OVAL_CY}
            rx={OVAL_RX}
            ry={OVAL_RY}
            fill="black"
          />
        </mask>
      </defs>

      {/* dark overlay outside oval */}
      <rect
        width={svgWidth}
        height={SVG_HEIGHT}
        fill="rgba(11,13,15,0.72)"
        mask="url(#oval-mask)"
      />

      {/* oval border — doubles as countdown */}
      <ellipse
        cx={ovalCx}
        cy={OVAL_CY}
        rx={OVAL_RX}
        ry={OVAL_RY}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />
      {countdownActive && (
        <ellipse
          cx={ovalCx}
          cy={OVAL_CY}
          rx={OVAL_RX}
          ry={OVAL_RY}
          fill="none"
          stroke={ACCENT}
          strokeWidth="3"
          strokeDasharray="865"
          strokeDashoffset="865"
          strokeLinecap="round"
          style={{
            animation: `fr-countdown-ring ${STEPS[currentStep]?.countdown ?? COUNTDOWN_MS}ms linear forwards`,
            filter: `drop-shadow(0 0 6px ${ACCENT})`,
          }}
        />
      )}

      {/* curved crosshair lines */}
      <path
        d={`M ${tx} 0 Q ${tx + vCurve} ${ty * 0.5} ${tx} ${ty} Q ${tx + vCurve} ${ty + (SVG_HEIGHT - ty) * 0.5} ${tx} ${SVG_HEIGHT}`}
        fill="none"
        stroke={crossColor}
        strokeWidth="1.2"
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />
      <path
        d={`M 0 ${ty} Q ${tx * 0.5} ${ty + hCurve} ${tx} ${ty} Q ${tx + (svgWidth - tx) * 0.5} ${ty + hCurve} ${svgWidth} ${ty}`}
        fill="none"
        stroke={crossColor}
        strokeWidth="1.2"
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />

      {/* crosshair center rings */}
      <ellipse
        cx={tx}
        cy={ty}
        rx={20 - Math.abs(vCurve) * 0.2}
        ry={20 - Math.abs(hCurve) * 0.2}
        fill="none"
        stroke={crossColor}
        strokeWidth="1.8"
        transform={`rotate(${vCurve > 0 ? 8 : vCurve < 0 ? -8 : 0} ${tx} ${ty})`}
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />
      <ellipse
        cx={tx}
        cy={ty}
        rx={10 - Math.abs(vCurve) * 0.1}
        ry={10 - Math.abs(hCurve) * 0.1}
        fill="none"
        stroke={crossColor}
        strokeWidth="1.2"
        opacity={0.5}
        transform={`rotate(${vCurve > 0 ? 8 : vCurve < 0 ? -8 : 0} ${tx} ${ty})`}
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />
      <circle
        cx={tx}
        cy={ty}
        r="4"
        fill={crossColor}
        style={{ filter: crossGlow, transition: "all .4s ease" }}
      />

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
}
