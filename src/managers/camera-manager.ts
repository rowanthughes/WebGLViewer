import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LoadedModel } from './model-manager';

const MODEL_PADDING_FACTOR = 2;

/** The CameraManager class handles camera initialization and updates **/
export class CameraManager {
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  private container: HTMLElement;

  constructor(
    container: HTMLElement,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
  ) {
    this.container = container;
    this.initCamera();
    this.initControls(renderer.domElement);
  }

  private initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
  }

  private initControls(domElement: HTMLElement): void {
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.04;
    this.controls.minDistance = 0;
    this.controls.maxDistance = 1000;
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
  }

  /** Adjust the camera to fit the loaded model **/
  public adjustCameraToModel(model: LoadedModel): void {
    const box = new THREE.Box3().setFromObject(model.group);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Calculate model max dims -> camera distance
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);

    // Calculate distance to fit model in view
    let cameraZ = Math.abs((maxDim / 2) * Math.tan(fov * 2)) * MODEL_PADDING_FACTOR;

    // If the cameraZ is zero or NaN, set a default distance
    if (!cameraZ || isNaN(cameraZ)) {
      cameraZ = maxDim * 2;
    }

    this.camera.position.set(center.x, center.y, cameraZ);

    this.controls.target.copy(center);
    this.controls.update();
  }

  public onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public update(): void {
    this.controls.update();
  }
}
