import { useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";
import { MODEL_URL } from "../constants";

export function useFaceModels() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadModels = useCallback(async () => {
    if (modelsLoaded) return;
    setLoading(true);
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    setModelsLoaded(true);
    setLoading(false);
  }, [modelsLoaded]);

  return { modelsLoaded, loading, loadModels };
}
