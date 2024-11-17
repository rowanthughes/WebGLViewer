import { ShaderType } from '../types/shader-types';
import { ModelOption } from '../types/model-types';

/** The AssetManager class handles available models and shaders **/
export class AssetManager {
  private models: ModelOption[] = [];
  private shaders: ShaderType[] = [];

  constructor() {
    this.loadAssets();
  }

  private loadAssets(): void {
    this.models = [
      { name: 'Duck', path: '/models/gltf/duck.glb' },
      { name: 'Boxes', path: '/models/gltf/boxes.glb' },
    ];

    this.shaders = ['Normal', 'Silhouette', 'Toon', 'Phong'];
  }

  public getAvailableModels(): ModelOption[] {
    return this.models;
  }

  public getAvailableShaders(): ShaderType[] {
    return this.shaders;
  }
}
