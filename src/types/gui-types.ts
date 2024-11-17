import { ShaderType } from './shader-types';

export interface GUIParams {
  wireframeVisible: boolean;
  normalsVisible: boolean;
  tangentsVisible: boolean;
  boundingBoxVisible: boolean;
  wireframeOpacity: number;
  color: number;
  sunLightColor: number;
  ambientLightColor: number;
  bgColor: number;
  sunLightIntensity: number;
  ambientLightIntensity: number;
  shininess: number;
  selectedModel: string;
  selectedShader: ShaderType;
}
