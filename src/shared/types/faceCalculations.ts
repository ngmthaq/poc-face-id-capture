export interface Point {
  x: number;
  y: number;
}

export interface SvgDims {
  svgWidth: number;
  svgHeight: number;
  ovalCx: number;
}

export interface FaceLandmarks {
  positions: Point[];
  getLeftEye: () => Point[];
  getRightEye: () => Point[];
  getJawOutline: () => Point[];
}

export interface PoseMeasurement {
  yaw: number;
  pitch: number;
  roll: number;
  masked: boolean;
  noseTip: Point;
}
