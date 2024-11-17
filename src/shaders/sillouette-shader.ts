import * as THREE from 'three';

export class SilhouetteShader {
  public static getMaterial(params: { color: number }): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;

        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 1.0);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color(params.color) },
      },
      side: THREE.DoubleSide,
    });
  }
}
