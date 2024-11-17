import * as THREE from 'three';
import { ShaderType } from '../types/shader-types';
import { LoadedModel } from './model-manager';
import { ShaderFactory } from '../utils/shader-factory';

/** The ShaderManager class handles shader switching and management **/
export class ShaderManager {
  private currentShaderType: ShaderType;

  constructor(initialShader: ShaderType) {
    this.currentShaderType = initialShader;
  }

  switchShader(newShader: ShaderType, model: LoadedModel, params: any): void {
    if (newShader === this.currentShaderType) return;
    this.currentShaderType = newShader;

    if (model && model.materials) {
      model.materials.forEach((mat) => mat.dispose());
      model.materials = [];
    }

    model.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }

        const newShaderMaterial = ShaderFactory.createShader(newShader, {
          color: params.color,
          shininess: params.shininess || 30,
          map: mesh.userData.originalMap,
        });

        mesh.material = newShaderMaterial;
        model.materials.push(newShaderMaterial);
      }
    });
  }

  getCurrentShaderType(): ShaderType {
    return this.currentShaderType;
  }
}
