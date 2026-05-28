import { useTranslate } from "../../shared/translations";
import { S } from "../../shared/styles/faceRegister";

export default function LoadingOverlay() {
  const { t } = useTranslate();

  return (
    <div style={S.loadingOverlay}>
      <div style={S.spinner} />
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "rgba(255,255,255,.6)",
        }}
      >
        {t("faceRegister.loadingModels")}
      </div>
    </div>
  );
}
