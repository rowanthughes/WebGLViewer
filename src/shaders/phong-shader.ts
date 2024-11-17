import * as THREE from 'three';

export class PhongShader {
  public static getMaterial(options: {
    color: number;
    shininess: number;
    map?: THREE.Texture;
  }): THREE.ShaderMaterial {
    const phongShader = THREE.ShaderLib['phong'];
    const uniforms = THREE.UniformsUtils.clone(phongShader.uniforms);

    uniforms['diffuse'].value = new THREE.Color(options.color);
    uniforms['shininess'].value = options.shininess;

    const defines: { [key: string]: any } = {};

    if (options.map) {
      uniforms['map'] = { value: options.map };
      defines['USE_MAP'] = '';
      defines['USE_UV'] = '';
      defines['MAP_UV'] = 'uv';
    }

    return new THREE.ShaderMaterial({
      vertexShader: phongShader.vertexShader,
      fragmentShader: phongShader.fragmentShader,
      uniforms: uniforms,
      lights: true,
      side: THREE.DoubleSide,
      defines: defines,
    });
  }
}
