import GUI from 'lil-gui';
import * as THREE from 'three';
import { State } from '../utils/state';
import { ShaderType } from '../types/shader-types';
import { ModelManager } from './model-manager';
import { ShaderManager } from './shader-manager';
import { CameraManager } from './camera-manager';
import { ModelOption } from '../types/model-types';
import { Logger } from '../utils/logger';

export class GUIManager {
  private gui: GUI;
  private state: State;
  private modelManager: ModelManager;
  private shaderManager: ShaderManager;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private scene: THREE.Scene;
  private cameraManager: CameraManager;
  private availableModels: ModelOption[];
  private availableShaders: ShaderType[];

  constructor(
    gui: GUI,
    state: State,
    dependencies: {
      availableModels: ModelOption[];
      availableShaders: ShaderType[];
      modelManager: ModelManager;
      shaderManager: ShaderManager;
      sunLight: THREE.DirectionalLight;
      ambientLight: THREE.AmbientLight;
      scene: THREE.Scene;
      cameraManager: CameraManager;
    }
  ) {
    this.gui = gui;
    this.state = state;
    this.modelManager = dependencies.modelManager;
    this.shaderManager = dependencies.shaderManager;
    this.sunLight = dependencies.sunLight;
    this.ambientLight = dependencies.ambientLight;
    this.scene = dependencies.scene;
    this.cameraManager = dependencies.cameraManager;
    this.availableModels = dependencies.availableModels;
    this.availableShaders = dependencies.availableShaders;

    this.initGUI();
  }

  private initGUI(): void {
    const stateData = this.state.getState();

    // Model selection
    this.gui
      .add(stateData, 'selectedModel', this.availableModels.map((model) => model.name))
      .name('Select Model')
      .onChange(async (value: string) => {
        this.state.updateState({ selectedModel: value });
        const modelPath =
          this.availableModels.find((model) => model.name === value)?.path || '';
        try {
          await this.modelManager.loadModel(
            modelPath,
            this.shaderManager.getCurrentShaderType(),
            this.state.getState()
          );
          const currentModel = this.modelManager.getCurrentModel();
          if (currentModel) {
            this.cameraManager.adjustCameraToModel(currentModel);
          }
        } catch (error) {
          Logger.error('Failed to load model:', error);
        }
      });

    // Shader selection
    this.gui
      .add(stateData, 'selectedShader', this.availableShaders)
      .name('Shader')
      .onChange((value: ShaderType) => {
        this.state.updateState({ selectedShader: value });
        const currentModel = this.modelManager.getCurrentModel();
        if (currentModel) {
          this.shaderManager.switchShader(value, currentModel, this.state.getState());
        }
      });

    // Wireframe visibility
    this.gui
      .add(stateData, 'wireframeVisible')
      .name('Wireframe')
      .onChange((value: boolean) => {
        this.state.updateState({ wireframeVisible: value });
        const currentModel = this.modelManager.getCurrentModel();
        currentModel?.helpers?.wireframes?.forEach((wireframe) => {
          wireframe.visible = value;
        });
      });

    // Wireframe color
    this.gui
      .addColor(stateData, 'color')
      .name('Wireframe Color')
      .onChange((value: number) => {
        this.state.updateState({ color: value });
        const currentModel = this.modelManager.getCurrentModel();
        currentModel?.helpers?.wireframes?.forEach((wireframe) => {
          wireframe.material.color.set(value);
        });
        // Update materials as well
        currentModel?.materials.forEach((material) => {
          const shaderType = this.shaderManager.getCurrentShaderType();
          if (shaderType === 'Phong') {
            (material.uniforms['diffuse'].value as THREE.Color).set(value);
          } else if (shaderType === 'Silhouette' || shaderType === 'Toon') {
            (material.uniforms['uColor'].value as THREE.Color).set(value);
          }
        });
      });

    // Wireframe opacity
    this.gui
      .add(stateData, 'wireframeOpacity', 0, 1, 0.01)
      .name('Wireframe Opacity')
      .onChange((value: number) => {
        this.state.updateState({ wireframeOpacity: value });
        const currentModel = this.modelManager.getCurrentModel();
        currentModel?.helpers?.wireframes?.forEach((wireframe) => {
          wireframe.material.opacity = value;
        });
      });

    // Normals visibility
    this.gui
      .add(stateData, 'normalsVisible')
      .name('Normals')
      .onChange((value: boolean) => {
        this.state.updateState({ normalsVisible: value });
        const currentModel = this.modelManager.getCurrentModel();
        currentModel?.helpers?.normalsHelpers?.forEach((normalsHelper) => {
          normalsHelper.visible = value;
        });
      });

    // Tangents visibility
    this.gui
      .add(stateData, 'tangentsVisible')
      .name('Tangents')
      .onChange((value: boolean) => {
        this.state.updateState({ tangentsVisible: value });
        const currentModel = this.modelManager.getCurrentModel();
        currentModel?.helpers?.tangentsHelpers?.forEach((tangentsHelper) => {
          tangentsHelper.visible = value;
        });
      });

    // Bounding box visibility
    this.gui
      .add(stateData, 'boundingBoxVisible')
      .name('Bounding Box')
      .onChange((value: boolean) => {
        this.state.updateState({ boundingBoxVisible: value });
        const currentModel = this.modelManager.getCurrentModel();
        currentModel?.helpers?.boundingBoxHelpers?.forEach((boundingBoxHelper) => {
          boundingBoxHelper.visible = value;
        });
      });

    // Sunlight intensity
    this.gui
      .add(stateData, 'sunLightIntensity', 0, 10, 0.001)
      .name('Sunlight Intensity')
      .onChange((value: number) => {
        this.state.updateState({ sunLightIntensity: value });
        this.sunLight.intensity = value;
      });

    // Sunlight color
    this.gui
      .addColor(stateData, 'sunLightColor')
      .name('Sunlight Color')
      .onChange((value: number) => {
        this.state.updateState({ sunLightColor: value });
        this.sunLight.color.set(value);
      });

    // Ambient light color
    this.gui
      .addColor(stateData, 'ambientLightColor')
      .name('Ambient Light Color')
      .onChange((value: number) => {
        this.state.updateState({ ambientLightColor: value });
        this.ambientLight.color.set(value);
      });

    // Ambient light intensity
    this.gui
      .add(stateData, 'ambientLightIntensity', 0, 10, 0.001)
      .name('Ambient Light Intensity')
      .onChange((value: number) => {
        this.state.updateState({ ambientLightIntensity: value });
        this.ambientLight.intensity = value;
      });

    // Background color
    this.gui
      .addColor(stateData, 'bgColor')
      .name('Background Color')
      .onChange((value: number) => {
        this.state.updateState({ bgColor: value });
        if (this.scene.background) {
          (this.scene.background as THREE.Color).set(value);
        }
      });

    // Material color (Diffuse Color)
    this.gui
      .addColor(stateData, 'color')
      .name('Diffuse Color')
      .onChange((value: number) => {
        this.state.updateState({ color: value });
        const currentModel = this.modelManager.getCurrentModel();
        currentModel?.materials.forEach((material) => {
          const shaderType = this.shaderManager.getCurrentShaderType();
          if (shaderType === 'Phong') {
            (material.uniforms['diffuse'].value as THREE.Color).set(value);
          } else if (shaderType === 'Silhouette' || shaderType === 'Toon') {
            (material.uniforms['uColor'].value as THREE.Color).set(value);
          }
        });
      });

    // Shininess
    this.gui
      .add(stateData, 'shininess', 0, 100)
      .name('Shininess')
      .onChange((value: number) => {
        this.state.updateState({ shininess: value });
        const currentModel = this.modelManager.getCurrentModel();
        currentModel?.materials.forEach((material) => {
          if (this.shaderManager.getCurrentShaderType() === 'Phong') {
            material.uniforms['shininess'].value = value;
          }
        });
      });
  }

  public dispose(): void {
    this.gui.destroy();
  }
}
