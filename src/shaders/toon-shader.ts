import * as THREE from 'three';

export class ToonShader {
  public static getMaterial(options: { color: number }): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform vec3 uColor;

        void main() {
          float intensity = dot(normalize(vViewPosition), vNormal);
          if (intensity > 0.95) {
            gl_FragColor = vec4(uColor, 1.0);
          } else if (intensity > 0.5) {
            gl_FragColor = vec4(uColor * 0.8, 1.0);
          } else if (intensity > 0.25) {
            gl_FragColor = vec4(uColor * 0.6, 1.0);
          } else {
            gl_FragColor = vec4(uColor * 0.4, 1.0);
          }
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color(options.color) },
      },
      side: THREE.DoubleSide,
    });
  }
}
