import * as THREE from "three";

/** Smoothed pointer position in [-1, 1], plus its raw target. */
export type Pointer = { x: number; y: number; tx: number; ty: number };
/** Called every frame: seconds since last frame, total seconds, pointer. */
export type Tick = (dt: number, t: number, pointer: Pointer) => void;
export type ResizeFn = (width: number, height: number) => void;

type StageOptions = { fov?: number; fog?: { color: THREE.ColorRepresentation; density: number } };

export type Stage = ReturnType<typeof createStage>;

// Anything in the scene that may own GPU resources.
type Disposable = THREE.Object3D & {
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
};

// Shared renderer lifecycle for the decorative scenes: sizing, pointer
// parallax, pausing while off-screen, reduced motion, and disposal.
export function createStage(mount: HTMLElement, { fov = 45, fog }: StageOptions = {}) {
  const scene = new THREE.Scene();
  if (fog) scene.fog = new THREE.FogExp2(fog.color, fog.density);

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.appendChild(renderer.domElement);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer: Pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let tick: Tick = () => {};
  let onResize: ResizeFn = () => {};
  let visible = true;

  const resize = () => {
    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    onResize(w, h);
    if (reduceMotion) renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(mount);

  const onPointer = (e: PointerEvent) => {
    const r = mount.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const clock = new THREE.Clock();
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    tick(dt, clock.elapsedTime, pointer);
    renderer.render(scene, camera);
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!reduceMotion) renderer.setAnimationLoop(visible ? loop : null);
  });
  io.observe(mount);

  return {
    scene,
    camera,
    renderer,
    reduceMotion,
    start(fn: Tick, resizeFn?: ResizeFn) {
      tick = fn;
      if (resizeFn) onResize = resizeFn;
      resize();
      if (reduceMotion) {
        // Advance to a composed frame once, then hold still.
        fn(0, 2.5, pointer);
        renderer.render(scene, camera);
      } else if (visible) {
        renderer.setAnimationLoop(loop);
      }
    },
    dispose() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      scene.traverse((node) => {
        const obj = node as Disposable;
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        mats.forEach((m) => {
          (m as THREE.Material & { map?: THREE.Texture | null }).map?.dispose();
          m.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
