import './style.css';
import * as THREE from 'three';
import GUI from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { State } from './utils/state';
import { ModelManager } from './managers/model-manager';
import { ShaderManager } from './managers/shader-manager';
import { GUIManager } from './managers/gui-manager';
import { CameraManager } from './managers/camera-manager';
import { AssetManager } from './managers/asset-manager';
import { ShaderFactory } from './utils/shader-factory';
import { ShaderType } from './types/shader-types';
import { GUIParams  } from './types/gui-types';

/** The main application class **/
export class App {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private gui: GUI;
  private state: State;
  private modelManager: ModelManager;
  private shaderManager: ShaderManager;
  private guiManager: GUIManager;
  private cameraManager: CameraManager;
  private assetManager: AssetManager;
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private params: GUIParams;
  private availableModels: { name: string; path: string }[];
  private availableShaders: ShaderType[];

  constructor(container: HTMLElement) {
    this.container = container;
    this.assetManager = new AssetManager();
    ShaderFactory.initialize();
    this.initParams();
    this.initState();
    this.initRenderer();
    this.initScene();
    this.initCameraManager();
    this.initLights();
    this.initManagers();
    this.initGUI();
    this.loadInitialModel();
    this.addEventListeners();
    this.renderLoop();
  };

  /** Initialize default GUI parameters **/
  private initParams(): void {
    this.availableModels = this.assetManager.getAvailableModels();
    this.availableShaders = this.assetManager.getAvailableShaders();

    this.params = {
      wireframeVisible: true,
      normalsVisible: true,
      tangentsVisible: true,
      boundingBoxVisible: true,
      wireframeOpacity: 1,
      color: 0xff0000,
      sunLightColor: 0xe8c37b,
      ambientLightColor: 0xa0a0fc,
      bgColor: 0x242437,
      sunLightIntensity: 1.96,
      ambientLightIntensity: 0.82,
      shininess: 30,
      selectedModel: this.availableModels[0].name,
      selectedShader: this.availableShaders[0],
    };
  };

  /** Initialize the GUI State **/
  private initState(): void {
    const initialState: GUIParams = {
      wireframeVisible: true,
      normalsVisible: true,
      tangentsVisible: true,
      boundingBoxVisible: true,
      wireframeOpacity: 1,
      color: 0xff0000,
      sunLightColor: 0xe8c37b,
      ambientLightColor: 0xa0a0fc,
      bgColor: 0x242437,
      sunLightIntensity: 1.96,
      ambientLightIntensity: 0.82,
      shininess: 30,
      selectedModel: this.availableModels[0].name,
      selectedShader: this.availableShaders[0],
    };

    this.state = new State(initialState);
  }

  /** Initialize the renderer **/
  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
  };

  /** Initialize the scene **/
  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.params.bgColor);
  };

  /** Initialize the camera and controls using CameraManager **/
  private initCameraManager(): void {
    this.cameraManager = new CameraManager(this.container, this.scene, this.renderer);
  };

  /** Initialize lights **/
  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(
      this.params.ambientLightColor,
      this.params.ambientLightIntensity
    );
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(
      this.params.sunLightColor,
      this.params.sunLightIntensity
    );
    this.sunLight.position.set(-69, 44, 14);
    this.scene.add(this.sunLight);
  };

  /** Initialize managers **/
  private initManagers(): void {
    const loader = new GLTFLoader();
    this.modelManager = new ModelManager(this.scene, loader, this.state);
    this.shaderManager = new ShaderManager(this.params.selectedShader);
  };

  /** Initialize GUI **/
  private initGUI(): void {
    this.gui = new GUI();
    this.guiManager = new GUIManager(this.gui, this.state, {
      availableModels: this.availableModels,
      availableShaders: this.availableShaders,
      modelManager: this.modelManager,
      shaderManager: this.shaderManager,
      sunLight: this.sunLight,
      ambientLight: this.ambientLight,
      scene: this.scene,
      cameraManager: this.cameraManager,
    });
  };

  /** Load the initial model **/
  private async loadInitialModel(): Promise<void> {
    const modelPath =
      this.availableModels.find((model) => model.name === this.params.selectedModel)?.path || '';
    await this.modelManager.loadModel(modelPath, this.shaderManager.getCurrentShaderType(), {
      wireframeVisible: this.params.wireframeVisible,
      normalsVisible: this.params.normalsVisible,
      tangentsVisible: this.params.tangentsVisible,
      boundingBoxVisible: this.params.boundingBoxVisible,
      wireframeOpacity: this.params.wireframeOpacity,
      color: this.params.color,
      shininess: this.params.shininess,
    });

    const currentModel = this.modelManager.getCurrentModel();

    if (currentModel) {
      this.cameraManager.adjustCameraToModel(currentModel);
    }
  };

  /** Add event listeners **/
  private addEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Listen for modelLoaded event to adjust camera
    this.modelManager.on('modelLoaded', (model) => {
      this.cameraManager.adjustCameraToModel(model);
    });
  };

  /** Handle window resize events **/
  private onWindowResize(): void {
    this.cameraManager.onWindowResize();
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  /** Render loop **/
  private renderLoop(): void {
    this.cameraManager.update();
    this.renderer.render(this.scene, this.cameraManager.camera);
    requestAnimationFrame(this.renderLoop.bind(this));
  };
};

const container = document.getElementById('app');
if (!container) {
  throw new Error('Cannot find #app element in the DOM.');
}
new App(container);
