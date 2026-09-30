import * as THREE from "three";
import { createAirship, createSailboat } from "./scene-models";
import { paintingDepth, paintingWater, scenePresets, type SceneKind } from "./scene-presets";

export type SceneController = {
  setPaused(value: boolean): void;
  setVisible(value: boolean): void;
  nudge(direction: number): void;
  dispose(): void;
};

type SceneOptions = { image: string; kind: SceneKind; fit: "fill" | "cover"; position: string; interaction: HTMLElement };

const vertexShader = `
  attribute float water;
  varying vec2 vUv;
  varying float vWater;
  void main() {
    vUv = uv;
    vWater = water;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D painting;
  uniform float time;
  uniform vec3 ripple;
  uniform vec2 look;
  varying vec2 vUv;
  varying float vWater;
  void main() {
    vec2 uv = vUv;
    float wave = sin(uv.y * 310.0 + time * .8 + sin(uv.x * 75.0)) * .00048;
    uv.x += vWater * wave;
    uv.y += vWater * sin(uv.x * 180.0 - time * .65) * .0003;
    vec2 delta = (uv - ripple.xy) * vec2(1.6, 1.0);
    float distance = length(delta);
    float age = time - ripple.z;
    float ring = sin(distance * 170.0 - age * 6.0) * exp(-abs(distance - age * .085) * 35.0) * exp(-age * .7);
    if (age > 0.0 && age < 8.0) uv += normalize(delta + .0001) * ring * .0022 * vWater;
    vec4 color = texture2D(painting, clamp(uv, .001, .999));
    float glint = pow(max(0.0, sin(uv.y * 580.0 + sin(uv.x * 190.0) * 2.0 + time * .55)), 18.0);
    color.rgb += vec3(.07, .052, .023) * glint * vWater * (.5 + .5 * sin(time * .2 + uv.x * 70.0));
    // Changing incidence is subtle: the original illustration already contains its light.
    color.rgb *= 1.0 + look.x * .012 * (uv.x - .3);
    gl_FragColor = color;
    #include <colorspace_fragment>
  }
`;

/** Perspective-correct, textured relief plus independently lit, fully volumetric sculptures. */
export async function createPaintingScene(host: HTMLDivElement, options: SceneOptions): Promise<SceneController> {
  const { kind, fit, position, interaction } = options;
  const preset = scenePresets[kind];
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
  if (!context) throw new Error("WebGL2 is unavailable");
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  let texture: THREE.Texture;
  try { texture = await new THREE.TextureLoader().loadAsync(options.image); }
  catch (error) { renderer.dispose(); renderer.forceContextLoss(); throw error; }
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 40);
  camera.position.z = 10;
  scene.add(new THREE.HemisphereLight(0xe5f6ee, 0x776647, 2.6));
  const sun = new THREE.DirectionalLight(0xffe3a4, 3.2);
  sun.position.set(-4, 7, 5);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x87cdd6, 1.8);
  rim.position.set(6, 2, -1);
  scene.add(rim);

  const geometry = new THREE.PlaneGeometry(1, 1, 160, 96);
  const uv = geometry.getAttribute("uv");
  const points = geometry.getAttribute("position");
  const water = new Float32Array(points.count);
  const uniforms = {
    painting: { value: texture }, time: { value: 0 },
    ripple: { value: new THREE.Vector3(-2, -2, -100) },
    look: { value: new THREE.Vector2() },
  };
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
  const painting = new THREE.Mesh(geometry, material);
  scene.add(painting);

  const model = preset.model === "airship" ? createAirship() : preset.model === "sailboat" ? createSailboat() : null;
  if (model) scene.add(model);
  const propellers: THREE.Object3D[] = [];
  model?.traverse((object) => { if (object.name.startsWith("propeller")) propellers.push(object); });
  const modelBase = new THREE.Vector3();

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(64 * 3);
  // Seeded positions keep the composition stable across route remounts.
  for (let i = 0; i < 64; i++) {
    dustPositions[i * 3] = (Math.sin(i * 127.1) * 43758.5453 % 1) * 8;
    dustPositions[i * 3 + 1] = (Math.sin(i * 311.7) * 9631.912 % 1) * 4;
    dustPositions[i * 3 + 2] = 1.5 + (i % 13) * .12;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({ color: 0xffedb9, size: .012, transparent: true, opacity: .38, depthWrite: false });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  let width = 1;
  let height = 1;
  let viewWidth = 1;
  const viewHeight = Math.tan(THREE.MathUtils.degToRad(35 / 2)) * 20;
  let cropX = 1;
  let cropY = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isPaused = false;
  let visible = true;
  let disposed = false;
  let raf = 0;
  let time = 0;
  let lastTime = 0;
  let frames = 0;
  let lift = 0;
  let targetLift = 0;
  const target = new THREE.Vector2();
  const current = new THREE.Vector2();
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const maxDpr = coarse || kind === "gallery" ? 1 : 1.5;

  const resize = () => {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr, 2560 / width));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    viewWidth = viewHeight * camera.aspect;
    const aspect = (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height;
    const cover = fit === "cover" || (kind === "gallery" && width <= 768);
    cropX = cover ? Math.min(1, camera.aspect / aspect) : 1;
    cropY = cover ? Math.min(1, aspect / camera.aspect) : 1;
    const horizontal = Number.parseFloat(position) / 100;
    offsetX = (1 - cropX) * (Number.isFinite(horizontal) ? horizontal : .5);
    offsetY = (1 - cropY) * .5;
    for (let i = 0; i < points.count; i++) {
      const col = i % 161;
      const row = Math.floor(i / 161);
      const sx = col / 160;
      const sy = row / 96;
      const x = offsetX + sx * cropX;
      const y = offsetY + sy * cropY;
      const depth = paintingDepth(kind, x, y);
      // Compensate depth at rest so architecture aligns with the original painting.
      points.setXYZ(i, (sx - .5) * viewWidth * 1.045 * (10 - depth) / 10, (.5 - sy) * viewHeight * 1.045 * (10 - depth) / 10, depth);
      uv.setXY(i, x, 1 - y);
      water[i] = paintingWater(kind, x, y);
    }
    points.needsUpdate = true;
    uv.needsUpdate = true;
    geometry.setAttribute("water", new THREE.BufferAttribute(water, 1));
    geometry.computeBoundingSphere();
    if (model) {
      const x = (preset.anchor[0] - offsetX) / cropX;
      const y = (preset.anchor[1] - offsetY) / cropY;
      model.visible = x > .08 && x < .93;
      modelBase.set((x - .5) * viewWidth * .76, (.5 - y) * viewHeight * .76, 2.4);
      model.position.copy(modelBase);
      model.scale.setScalar(preset.scale * Math.min(1.3, camera.aspect / 1.65));
    }
    if (isPaused || !visible) renderer.render(scene, camera);
  };

  const samplePointer = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };
  const pointerMove = (event: PointerEvent) => {
    if (isPaused || event.pointerType === "touch") return;
    const point = samplePointer(event);
    target.set(THREE.MathUtils.clamp(point.x * 2 - 1, -1, 1), THREE.MathUtils.clamp(1 - point.y * 2, -1, 1));
  };
  const pointerLeave = () => { if (!isPaused) target.set(0, 0); };
  const pointerDown = (event: PointerEvent) => {
    if (isPaused || (event.target instanceof Element && event.target.closest("a,button,input,textarea,select,[role='button']"))) return;
    const point = samplePointer(event);
    uniforms.ripple.value.set(offsetX + point.x * cropX, 1 - (offsetY + point.y * cropY), time);
    targetLift = .2;
    if (event.pointerType === "touch") target.set((point.x - .5) * .7, (.5 - point.y) * .4);
  };

  const render = (now: number) => {
    raf = 0;
    if (disposed || isPaused || !visible) return;
    const delta = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60;
    lastTime = now;
    time += delta;
    const damping = 1 - Math.exp(-delta * 3.2);
    current.lerp(target, damping);
    lift += (targetLift - lift) * damping;
    targetLift *= Math.exp(-delta * .8);
    camera.position.set(current.x * .27, current.y * .18, 10);
    camera.lookAt(current.x * .035, current.y * .025, 0);
    uniforms.time.value = time;
    uniforms.look.value.copy(current);
    if (model) {
      model.position.copy(modelBase);
      model.position.y += Math.sin(time * .42) * .035 + lift;
      model.position.x += Math.sin(time * .11) * .1;
      model.rotation.set(Math.sin(time * .35) * .018, -.14 + current.x * .23, -.025 + Math.sin(time * .3) * .018 + current.y * .025);
      for (const propeller of propellers) propeller.rotation.x = time * 11;
    }
    dust.position.y = Math.sin(time * .08) * .12;
    dust.rotation.z = Math.sin(time * .045) * .02;
    renderer.render(scene, camera);
    frames++;
    if (frames % 8 === 0) { host.dataset.view = `${current.x.toFixed(3)},${current.y.toFixed(3)}`; host.dataset.frames = String(frames); }
    raf = requestAnimationFrame(render);
  };
  const schedule = () => { lastTime = 0; if (!raf && !disposed && visible && !isPaused) raf = requestAnimationFrame(render); };
  const lost = (event: Event) => { event.preventDefault(); host.dispatchEvent(new Event("scene-unavailable")); };
  const observer = new ResizeObserver(resize);
  canvas.addEventListener("webglcontextlost", lost);
  interaction.addEventListener("pointermove", pointerMove, { passive: true });
  interaction.addEventListener("pointerleave", pointerLeave, { passive: true });
  interaction.addEventListener("pointerdown", pointerDown, { passive: true });
  host.appendChild(canvas);
  host.dataset.view = "0.000,0.000";
  resize();
  observer.observe(host);
  renderer.render(scene, camera);
  schedule();

  return {
    setPaused(value) { isPaused = value; if (value) { cancelAnimationFrame(raf); raf = 0; } else schedule(); },
    setVisible(value) { visible = value; if (value) schedule(); else { cancelAnimationFrame(raf); raf = 0; } },
    nudge(direction) { if (!isPaused) target.set(direction === 0 ? 0 : THREE.MathUtils.clamp(target.x + direction * .7, -1, 1), 0); },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      interaction.removeEventListener("pointermove", pointerMove);
      interaction.removeEventListener("pointerleave", pointerLeave);
      interaction.removeEventListener("pointerdown", pointerDown);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>([texture]);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return;
        geometries.add(object.geometry);
        for (const item of Array.isArray(object.material) ? object.material : [object.material]) {
          materials.add(item);
          Object.values(item).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
        }
      });
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      textures.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
