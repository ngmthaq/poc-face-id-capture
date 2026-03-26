import { useTranslation } from "react-i18next";
import { S } from "../styles";

export default function LoadingOverlay() {
  const { t } = useTranslation();

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
