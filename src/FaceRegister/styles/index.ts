import type { CSSProperties } from "react";
import { ACCENT, BG } from "../constants";

export const injectStyles = () => {
  const id = "face-register-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes fr-pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
    @keyframes fr-flash { 0%{opacity:.85} 100%{opacity:0} }
    @keyframes fr-countdown-ring {
      from { stroke-dashoffset: 865; }
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

export const S: Record<string, CSSProperties> = {
  root: {
    position: "fixed",
    inset: 0,
    background: BG,
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif',
    color: "#fff",
    overflowX: "hidden",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
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
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,.6)",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: 8,
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
  introSub: {
    fontSize: 15,
    color: "rgba(255,255,255,.5)",
    marginBottom: 40,
  },
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
  svgOverlay: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
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
  captureBackBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,.7)",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  hudTitle: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" },
  hudProgress: {
    fontSize: 15,
    fontWeight: 500,
    color: "rgba(255,255,255,.6)",
  },
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
    minHeight: "100%",
    padding: "60px 24px 40px",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
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
  resultSub: {
    fontSize: 14,
    color: "rgba(255,255,255,.45)",
    marginBottom: 32,
  },
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
  gridLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "rgba(255,255,255,.45)",
  },
  resultBtnsWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 380,
  },
  resultBtns: { display: "flex", gap: 12, width: "100%" },

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
