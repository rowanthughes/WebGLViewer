import * as THREE from 'three';
import { NormalShader } from '../shaders/normal-shader';
import { SilhouetteShader } from '../shaders/sillouette-shader';
import { ToonShader } from '../shaders/toon-shader';
import { PhongShader } from '../shaders/phong-shader';
import { ShaderType } from '../types/shader-types';

type ShaderFactoryFunction = (options?: any) => THREE.ShaderMaterial;

export class ShaderFactory {
  private static shaders: { [key: string]: ShaderFactoryFunction } = {};

  public static initialize(): void {
    ShaderFactory.registerShader('Normal', () => NormalShader.getMaterial());

    ShaderFactory.registerShader('Silhouette', (options) =>
      SilhouetteShader.getMaterial({ color: options.color })
    );

    ShaderFactory.registerShader('Toon', (options) =>
        ToonShader.getMaterial({ color: options.color })
    );

    ShaderFactory.registerShader('Phong', (options) =>
      PhongShader.getMaterial({
        color: options.color,
        shininess: options.shininess,
        map: options.map,
      })
    );
  }

  public static registerShader(name: ShaderType, factoryFunction: ShaderFactoryFunction): void {
    ShaderFactory.shaders[name] = factoryFunction;
  }

  public static createShader(name: ShaderType, options?: any): THREE.ShaderMaterial {
    const factoryFunction = ShaderFactory.shaders[name];
    if (!factoryFunction) {
      throw new Error(`Shader "${name}" not registered.`);
    }
    return factoryFunction(options);
  }
}
