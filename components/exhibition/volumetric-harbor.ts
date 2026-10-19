import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

export type HarborController = {
  pause(value: boolean): void;
  visible(value: boolean): void;
  view(direction: number): void;
  step(): void;
  dispose(): void;
};

/** Independently shaded Blender geometry, real reflected geometry and pigment water. */
export async function createVolumetricHarbor(host: HTMLElement): Promise<HarborController> {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#d5cba8", .0015);
  const camera = new THREE.PerspectiveCamera(41, 1, .1, 650);
  scene.add(new THREE.HemisphereLight("#d7efff", "#cda974", .9));
  const sun = new THREE.DirectionalLight("#ffe5b5", 3.2);
  sun.position.set(-35, 55, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 180 });
  sun.shadow.bias = -.00025;
  sun.shadow.normalBias = .035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#d6edf6", .75);
  fill.position.set(-5, 15, 35);
  scene.add(fill);
  const draco = new DRACOLoader().setDecoderPath("/models/home-harbor/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let atlas: THREE.Texture | undefined;
  let coast: THREE.Texture | undefined;
  let architecture: THREE.Group;
  try {
    atlas = await new THREE.TextureLoader().loadAsync("/models/home-harbor/material-atlas.webp");
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    coast = await new THREE.TextureLoader().loadAsync("/models/home-harbor/coast-v1.webp");
    coast.colorSpace = THREE.SRGBColorSpace;
    scene.background = coast;
    architecture = (await loader.loadAsync("/models/home-harbor/harbor.glb")).scene;
  } catch (error) {
    atlas?.dispose(); coast?.dispose(); draco.dispose(); renderer.dispose(); renderer.forceContextLoss();
    throw error;
  }
  const offsets: Record<string, [number, number]> = { stone: [0, .5], copper: [.5, .5], wood: [0, 0], cloth: [.5, 0] };
  const strengths: Record<string, number> = { stone: .30, copper: .36, wood: .28, cloth: .18 };
  architecture.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true; object.receiveShadow = true;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      const name = material.name.toLowerCase();
      if (name.includes("distant coast")) { object.visible = false; continue; }
      const kind = /limestone|sandstone|plaster/.test(name) ? "stone" : /copper/.test(name) ? "copper" : /oak/.test(name) ? "wood" : /sail/.test(name) ? "cloth" : null;
      if (kind === "stone") material.color.set("#e6ddc9");
      if (kind === "copper") material.color.set("#718d83");
      if (kind) {
        material.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, { paintAtlas: { value: atlas }, paintOffset: { value: new THREE.Vector2(...offsets[kind]) }, paintScale: { value: kind === "stone" ? .44 : .65 }, paintStrength: { value: strengths[kind] } });
          shader.vertexShader = "varying vec3 vPaintPosition; varying vec3 vPaintNormal;\n" + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvPaintPosition=(modelMatrix*vec4(position,1.)).xyz; vPaintNormal=normalize(mat3(modelMatrix)*normal);");
          shader.fragmentShader = "uniform sampler2D paintAtlas; uniform vec2 paintOffset; uniform float paintScale; uniform float paintStrength; varying vec3 vPaintPosition; varying vec3 vPaintNormal;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
            vec3 pw=pow(abs(normalize(vPaintNormal)),vec3(5.)); pw/=max(pw.x+pw.y+pw.z,.001);
            vec3 tx=texture2D(paintAtlas,paintOffset+vec2(.012)+fract(vPaintPosition.yz*paintScale)*.476).rgb;
            vec3 ty=texture2D(paintAtlas,paintOffset+vec2(.012)+fract(vPaintPosition.xz*paintScale)*.476).rgb;
            vec3 tz=texture2D(paintAtlas,paintOffset+vec2(.012)+fract(vPaintPosition.xy*paintScale)*.476).rgb;
            diffuseColor.rgb=mix(diffuseColor.rgb,tx*pw.x+ty*pw.y+tz*pw.z,paintStrength);`);
        };
        material.customProgramCacheKey = () => `harbor-paint-${kind}`;
      }
      if (/window glass/.test(name)) { material.color.set("#557a7d"); material.metalness = .5; material.roughness = .3; }
    }
  });
  scene.add(architecture);
  const waterShader = {
    uniforms: { tDiffuse: { value: null }, color: { value: null }, textureMatrix: { value: null }, time: { value: 0 } },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
      void main(){vUv=textureMatrix*vec4(position,1.); vWorld=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec4 vUv; varying vec3 vWorld;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 uv=vUv.xy/vUv.w; float grain=noise(vWorld.xz*.6+vec2(time*.06,0.));
        uv.x+=sin(vWorld.z*1.5-time*.6+grain*4.)*.0018; uv.y+=sin(vWorld.x*.6+time*.5)*.001;
        vec4 reflection=texture2D(tDiffuse,uv);
        float stroke=sin(vWorld.z*2.8+grain*5.-time*.5)*noise(vWorld.xz*.2);
        float flecks=pow(.5+.5*sin(vWorld.z*3.1+grain*7.-time*.45),14.)*noise(vWorld.xz*vec2(.3,1.));
        float fade=smoothstep(30.,180.,length(vWorld.xz-cameraPosition.xz));
        vec3 pigment=mix(vec3(.12,.18,.14),vec3(.19,.25,.17),.5+.12*stroke);
        pigment=mix(pigment,vec3(.30,.35,.25),fade); pigment+=vec3(.07,.04,.014)*flecks*(1.-fade)*.2;
        float horizonAlpha=1.-smoothstep(65.,280.,length(vWorld.xz-cameraPosition.xz));
        gl_FragColor=vec4(reflection.rgb,reflection.a*.58*(1.-fade)*horizonAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  };
  const water = new Reflector(new THREE.PlaneGeometry(650, 650), { shader: waterShader, textureWidth: 512, textureHeight: 512, multisample: 0, clipBias: .003 });
  const reflect = water.onBeforeRender;
  water.onBeforeRender = function (...args) {
    const background = scene.background;
    scene.background = null;
    try { reflect.apply(this, args); }
    finally { scene.background = background; }
  };
  if (water.material instanceof THREE.ShaderMaterial) {
    water.material.transparent = true;
    water.material.depthWrite = false;
  }
  water.rotation.x = -Math.PI / 2; water.position.set(0, .08, -100); scene.add(water);
  const target = new THREE.Vector2(); const current = new THREE.Vector2();
  let time = 0, frames = 0, raf = 0, last = 0, paused = false, visible = true, disposed = false;
  let aspect = 1;
  const draw = () => {
    camera.position.set(-1 + current.x * 2.1, 7.4 + current.y * .45, (aspect < 1 ? 35 : 48) - current.x * .7);
    camera.lookAt(aspect < 1 ? 15 : 3, 7.3, -9);
    if (water.material instanceof THREE.ShaderMaterial) water.material.uniforms.time.value = time;
    renderer.render(scene, camera); frames++;
    host.dataset.frames = String(frames); host.dataset.time = time.toFixed(3);
    host.dataset.view = `${current.x.toFixed(3)},${current.y.toFixed(3)}`;
    host.dataset.drawCalls = String(renderer.info.render.calls);
    host.dataset.triangles = String(renderer.info.render.triangles);
  };
  const resize = () => {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    aspect = width / height;
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1 : 1.5)); renderer.setSize(width, height, false);
    camera.aspect = aspect; camera.fov = aspect < .8 ? 52 : 41; camera.updateProjectionMatrix(); draw();
  };
  const render = (now: number) => {
    raf = 0; if (disposed || paused || !visible) return;
    const delta = last ? Math.min((now - last) / 1000, .05) : 1 / 60; last = now; time += delta;
    current.lerp(target, 1 - Math.exp(-delta * 4)); draw(); raf = requestAnimationFrame(render);
  };
  const schedule = () => { last = 0; if (!raf && !disposed && !paused && visible) raf = requestAnimationFrame(render); };
  const move = (event: PointerEvent) => {
    if (paused || event.pointerType === "touch") return;
    const rect = host.getBoundingClientRect(); target.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
  };
  const leave = () => { if (!paused) target.set(0, 0); };
  const lost = (event: Event) => { event.preventDefault(); host.dispatchEvent(new Event("harbor-unavailable")); };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  host.appendChild(renderer.domElement); host.dataset.model = "blender-volumetric";
  host.addEventListener("pointermove", move, { passive: true }); host.addEventListener("pointerleave", leave, { passive: true });
  const observer = new ResizeObserver(resize); observer.observe(host); resize(); schedule();
  return {
    pause(value) { paused = value; cancelAnimationFrame(raf); raf = 0; if (!paused) schedule(); },
    visible(value) { visible = value; cancelAnimationFrame(raf); raf = 0; if (visible) schedule(); },
    view(direction) { if (!paused) target.set(direction, 0); },
    step() { paused = true; cancelAnimationFrame(raf); raf = 0; time += 1 / 30; current.lerp(target, .12); draw(); },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); renderer.domElement.removeEventListener("webglcontextlost", lost);
      const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
      scene.traverse(object => { if (object instanceof THREE.Mesh) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(item => materials.add(item)); } });
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
      water.getRenderTarget().dispose(); atlas?.dispose(); coast?.dispose(); draco.dispose(); sun.shadow.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
