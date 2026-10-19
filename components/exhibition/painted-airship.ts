import * as THREE from "three";

/** A painted cutout in the same perspective space as the harbor architecture. */
export async function createPaintedAirship() {
  const texture = await new THREE.TextureLoader().loadAsync("/images/site-backgrounds/harbor-explorer-airship-v1.webp");
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.renderOrder = 2;
  const aspect = texture.image.width / texture.image.height;
  const base = new THREE.Vector3();
  return {
    mesh,
    resize(viewWidth: number, viewHeight: number, portrait: boolean) {
      // Keep clear of the title, navigation and the skyline in both compositions.
      const x = portrait ? .73 : .69;
      const y = portrait ? .145 : .285;
      const depth = 2.8;
      const perspective = (10 - depth) / 10;
      base.set((x - .5) * viewWidth * perspective, (.5 - y) * viewHeight * perspective, depth);
      const width = viewWidth * (portrait ? .48 : .29) * perspective;
      mesh.scale.set(width, width / aspect, 1);
      mesh.position.copy(base);
    },
    update(time: number, look: THREE.Vector2) {
      mesh.position.copy(base);
      mesh.position.y += Math.sin(time * .48) * .035;
      mesh.position.x += Math.sin(time * .16) * .065;
      mesh.rotation.set(look.y * .035, look.x * .12, Math.sin(time * .36) * .012);
    },
  };
}
