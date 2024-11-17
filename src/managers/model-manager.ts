import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js';
import { VertexTangentsHelper } from 'three/examples/jsm/helpers/VertexTangentsHelper.js';
import { State } from '../utils/state';
import { EventEmitter } from '../utils/event-emitter';
import { ShaderFactory } from '../utils/shader-factory';
import { ShaderType } from '../types/shader-types';
import { GUIParams } from '../types/gui-types';
import { Logger } from '../utils/logger';

export interface LoadedModel {
  group: THREE.Group;
  materials: THREE.ShaderMaterial[];
  helpers: {
    wireframes: THREE.LineSegments<THREE.WireframeGeometry, THREE.LineBasicMaterial>[];
    normalsHelpers: VertexNormalsHelper[];
    tangentsHelpers: VertexTangentsHelper[];
    boundingBoxHelpers: THREE.BoxHelper[];
  };
}

/** The ModelManager class handles loading and disposing of 3D models **/
export class ModelManager extends EventEmitter {
  private state: State;
  private loader: GLTFLoader;
  private scene: THREE.Scene;
  private currentModel: LoadedModel | null = null;

  constructor(scene: THREE.Scene, loader: GLTFLoader, state: State) {
    super();
    this.loader = loader;
    this.scene = scene;
    this.state = state;

    // Listen for state changes
    this.state.on('stateChanged', this.onStateChanged.bind(this));
  }

  private onStateChanged(newState: GUIParams): void {
    // Update the current model based on the new state
    const currentModel = this.getCurrentModel();
    if (currentModel) {
      currentModel.helpers.wireframes.forEach((wireframe) => {
        wireframe.visible = newState.wireframeVisible;
      });
      // Update other helpers and materials as needed
    }
  }

  /** Load a model and add it to the scene **/
  async loadModel(
    modelPath: string,
    shaderType: ShaderType,
    params: any
  ): Promise<void> {
    // Dispose of the current model
    if (this.currentModel) {
      this.disposeCurrentModel();
    }

    // Load new model
    try {
      this.currentModel = await this.loadAndProcessModel(
        modelPath,
        shaderType,
        params
      );

      // Emit an event when the model is loaded
      this.emit('modelLoaded', this.currentModel);
    } catch (error) {
        Logger.error('Failed to load model:', error);
    }
  }

  /** Dispose of the current model **/
  disposeCurrentModel(): void {
    if (this.currentModel) {
      this.disposeHelpers(this.currentModel.helpers);
      this.disposeModel(this.currentModel.group);
      this.currentModel = null;
    }
  }

  /** Get the currently loaded model **/
  getCurrentModel(): LoadedModel | null {
    return this.currentModel;
  }

  /** Load and process the model **/
  private loadAndProcessModel(
    modelPath: string,
    shaderType: ShaderType,
    params: any
  ): Promise<LoadedModel> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => {
          const group = gltf.scene;

          const wireframes: THREE.LineSegments<
            THREE.WireframeGeometry,
            THREE.LineBasicMaterial
          >[] = [];
          const normalsHelpers: VertexNormalsHelper[] = [];
          const tangentsHelpers: VertexTangentsHelper[] = [];
          const boundingBoxHelpers: THREE.BoxHelper[] = [];

          const materials: THREE.ShaderMaterial[] = [];

          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh<
                THREE.BufferGeometry,
                THREE.Material | THREE.Material[]
              >;

              // Extract original material and texture
              const originalMaterial = mesh.material;
              let map: THREE.Texture | undefined;

              if (Array.isArray(originalMaterial)) {
                Logger.warn(
                  'Mesh has multiple materials; only the first one will be used for textures.'
                );
                const mat = originalMaterial[0] as THREE.MeshStandardMaterial;
                if (mat.map) {
                  map = mat.map;
                }
              } else {
                const mat = originalMaterial as THREE.MeshStandardMaterial;
                if (mat.map) {
                  map = mat.map;
                }
              }

              if (map) {
                mesh.userData.originalMap = map;
              }

              // Dispose of original material
              if (Array.isArray(originalMaterial)) {
                originalMaterial.forEach((mat) => mat.dispose());
              } else {
                originalMaterial.dispose();
              }

              // Create new ShaderMaterial for this mesh using ShaderFactory
              const newShaderMaterial = ShaderFactory.createShader(shaderType, {
                color: params.color,
                shininess: params.shininess || 30,
                map: map,
              });

              // Assign the new ShaderMaterial to the mesh
              mesh.material = newShaderMaterial;
              materials.push(newShaderMaterial);

              newShaderMaterial.needsUpdate = true;

              // Compute tangents if the mesh has tangents
              if (mesh.geometry.attributes.tangent) {
                mesh.geometry.computeTangents();
              }

              // Create wireframe geometry and material
              const wireframeGeometry = new THREE.WireframeGeometry(mesh.geometry);
              const wireframeMaterial = new THREE.LineBasicMaterial({
                color: params.color,
                linewidth: 1,
                transparent: true,
                opacity: params.wireframeOpacity,
              });
              const wireframe = new THREE.LineSegments(
                wireframeGeometry,
                wireframeMaterial
              );
              wireframe.visible = params.wireframeVisible;
              wireframes.push(wireframe);
              mesh.add(wireframe);

              // Create VertexNormalsHelper
              const normalsHelper = new VertexNormalsHelper(mesh, 0.25, 0x00ff00);
              normalsHelper.visible = params.normalsVisible;
              normalsHelpers.push(normalsHelper);
              this.scene.add(normalsHelper);

              // Create VertexTangentsHelper if tangents exist
              if (!mesh.geometry.attributes.tangent) {
                mesh.geometry.computeTangents();
              }
              const tangentsHelper = new VertexTangentsHelper(mesh, 0.25, 0x0000ff);
              tangentsHelper.visible = params.tangentsVisible;
              tangentsHelpers.push(tangentsHelper);
              this.scene.add(tangentsHelper);

              // Create BoundingBoxHelper
              const boundingBoxHelper = new THREE.BoxHelper(mesh, 0xffff00);
              boundingBoxHelper.visible = params.boundingBoxVisible;
              boundingBoxHelpers.push(boundingBoxHelper);
              this.scene.add(boundingBoxHelper);
            }
          });

          // Store all helpers in the LoadedModel object
          const helpers: LoadedModel['helpers'] = {
            wireframes,
            normalsHelpers,
            tangentsHelpers,
            boundingBoxHelpers,
          };

          // Add the loaded model to the scene
          this.scene.add(group);
          resolve({ group, materials, helpers });
        },
        undefined,
        (error) => {
            Logger.error('An error occurred while loading the model:', error);
            reject(error);
        }
      );
    });
  }

  private disposeModel(object: THREE.Object3D): void {
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.Material | THREE.Material[]
        >;

        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(mesh.material);
        }
      }
    });

    if (object.parent) {
      object.parent.remove(object);
    }
  }

  /** Disposes of a material and its associated textures **/
  private disposeMaterial(material: THREE.Material): void {
    material.dispose();

    for (const key in material) {
      const value = (material as any)[key];
      if (
        value &&
        typeof value === 'object' &&
        'minFilter' in value &&
        typeof value.dispose === 'function'
      ) {
        value.dispose();
      }
    }
  }

  private disposeHelpers(helpers: LoadedModel['helpers']): void {
    helpers.wireframes.forEach((wireframe) => {
      wireframe.geometry.dispose();
      wireframe.material.dispose();
      wireframe.removeFromParent();
    });
    helpers.normalsHelpers.forEach((normalsHelper) => {
      normalsHelper.removeFromParent();
    });
    helpers.tangentsHelpers.forEach((tangentsHelper) => {
      tangentsHelper.removeFromParent();
    });
    helpers.boundingBoxHelpers.forEach((boundingBoxHelper) => {
      boundingBoxHelper.removeFromParent();
    });
  }
}
