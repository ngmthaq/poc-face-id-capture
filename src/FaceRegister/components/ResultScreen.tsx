import { useTranslation } from "react-i18next";
import { ACCENT, type Capture } from "../constants";
import { S } from "../styles";

interface ResultScreenProps {
  captures: Capture[];
  onReset: () => void;
  onSave: () => void;
  onExit?: () => void;
}

export default function ResultScreen({
  captures,
  onReset,
  onSave,
  onExit,
}: ResultScreenProps) {
  const { t } = useTranslation();

  return (
    <div style={S.result}>
      <div style={S.resultIcon}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" stroke={ACCENT} strokeWidth="2" />
          <path
            d="M11 18.5L16 23.5L25 13.5"
            stroke={ACCENT}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="56"
            style={{ animation: "fr-checkmark .6s ease forwards" }}
          />
        </svg>
      </div>
      <div style={S.resultTitle}>{t("faceRegister.resultTitle")}</div>
      <div style={S.resultSub}>
        {t("faceRegister.resultSub", { count: captures.length })}
      </div>
      <div style={S.grid}>
        {captures.map((c) => (
          <div key={c.step} style={S.gridItem}>
            <img src={c.data} alt={t(c.labelKey)} style={S.gridImg} />
            <span style={S.gridLabel}>{t(c.labelKey)}</span>
          </div>
        ))}
      </div>
      <div style={S.resultBtnsWrap}>
        <button style={{ ...S.btn, width: "100%" }} onClick={onSave}>
          {t("faceRegister.save")}
        </button>
        <div style={S.resultBtns}>
          <button style={{ ...S.btnOutline, flex: 1 }} onClick={onReset}>
            {t("faceRegister.registerAgain")}
          </button>
          {onExit && (
            <button style={{ ...S.btnOutline, flex: 1 }} onClick={onExit}>
              {t("faceRegister.discard")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
