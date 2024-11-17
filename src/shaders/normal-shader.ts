import * as THREE from 'three';

export class NormalShader {
  public static getMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        varying vec3 vNormal;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying vec3 vNormal;

        void main() {
          vec3 color = vNormal * 0.5 + 0.5;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
  }
}
