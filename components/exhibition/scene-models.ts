import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Small, deliberately modelled objects for the painted exhibition scenes.
 * All geometry and materials belong to the returned group and may be disposed
 * by its owner. No textures, browser globals, lights, or external assets needed.
 */

type Surface = THREE.MeshStandardMaterial;

function surfaces() {
  return {
    ivory: new THREE.MeshStandardMaterial({ color: "#eadfc0", roughness: 0.77, metalness: 0.08 }),
    canvas: new THREE.MeshStandardMaterial({ color: "#f2e8c8", roughness: 0.96, side: THREE.DoubleSide }),
    teal: new THREE.MeshStandardMaterial({ color: "#486d69", roughness: 0.51, metalness: 0.42 }),
    darkTeal: new THREE.MeshStandardMaterial({ color: "#263f40", roughness: 0.68, metalness: 0.24 }),
    brass: new THREE.MeshStandardMaterial({ color: "#b99450", roughness: 0.4, metalness: 0.73 }),
    brightBrass: new THREE.MeshStandardMaterial({ color: "#dcc486", roughness: 0.31, metalness: 0.7 }),
    wood: new THREE.MeshStandardMaterial({ color: "#69513a", roughness: 0.85, metalness: 0 }),
    glass: new THREE.MeshStandardMaterial({
      color: "#284e55", roughness: 0.16, metalness: 0.52,
      emissive: "#557c76", emissiveIntensity: 0.14,
    }),
    rope: new THREE.MeshStandardMaterial({ color: "#897d60", roughness: 1, metalness: 0 }),
  };
}

/** Batch the small details by material, keeping the model economical to draw. */
class Workshop {
  private readonly parts = new Map<Surface, THREE.BufferGeometry[]>();

  constructor(readonly group: THREE.Group) {}

  add(geometry: THREE.BufferGeometry, material: Surface) {
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    if (part !== geometry) geometry.dispose();
    part.deleteAttribute("uv");
    const bucket = this.parts.get(material) ?? [];
    bucket.push(part);
    this.parts.set(material, bucket);
  }

  finish() {
    for (const [material, geometries] of this.parts) {
      const merged = mergeGeometries(geometries, false);
      if (merged) {
        const mesh = new THREE.Mesh(merged, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);
      }
      for (const geometry of geometries) geometry.dispose();
    }
    this.parts.clear();
  }
}

function sphere(x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  return new THREE.SphereGeometry(1, 24, 14).scale(sx, sy, sz).translate(x, y, z);
}

function rod(a: THREE.Vector3, b: THREE.Vector3, radius: number, endRadius = radius, segments = 8) {
  const direction = b.clone().sub(a);
  const geometry = new THREE.CylinderGeometry(endRadius, radius, direction.length(), segments);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
  return geometry.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
}

function line(points: THREE.Vector3[], radius: number, segments = 48, closed = false) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), segments, radius, 5, closed);
}

function ringX(x: number, y: number, z: number, radius: number, thickness: number, yScale = 1) {
  return new THREE.TorusGeometry(radius, thickness, 6, 48)
    .rotateY(Math.PI / 2).scale(1, yScale, 1).translate(x, y, z);
}

function ringY(x: number, y: number, z: number, radius: number, thickness: number) {
  return new THREE.TorusGeometry(radius, thickness, 6, 48).rotateX(Math.PI / 2).translate(x, y, z);
}

function cylinderX(x: number, y: number, z: number, radius: number, length: number, otherRadius = radius) {
  return new THREE.CylinderGeometry(radius, otherRadius, length, 32)
    .rotateZ(Math.PI / 2).translate(x, y, z);
}

function vector(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z);
}

function outline(shape: THREE.Shape, depth: number, bevel: number) {
  return new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelSegments: 2,
    steps: 1, bevelSize: bevel, bevelThickness: bevel,
    curveSegments: 16,
  }).translate(0, 0, -depth / 2);
}

function makePropeller(name: string, material: ReturnType<typeof surfaces>) {
  const propeller = new THREE.Group();
  propeller.name = name;
  propeller.userData.rotationAxis = "x";
  propeller.userData.spinSpeed = name.endsWith("port") ? 13 : -13;
  const workshop = new Workshop(propeller);
  workshop.add(sphere(0, 0, 0, 0.067, 0.037, 0.037), material.brass);
  for (let blade = 0; blade < 3; blade++) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.016, 0.025);
    shape.bezierCurveTo(-0.059, 0.10, -0.032, 0.21, 0.005, 0.215);
    shape.bezierCurveTo(0.029, 0.213, 0.039, 0.17, 0.024, 0.105);
    shape.lineTo(0.012, 0.025);
    shape.closePath();
    const geometry = outline(shape, 0.009, 0.002);
    geometry.rotateY(Math.PI / 2).rotateX((blade * Math.PI * 2) / 3);
    workshop.add(geometry, material.wood);
  }
  workshop.finish();
  return propeller;
}

/** A riveted, brass-ribbed touring airship. Nose points toward negative X. */
export function createAirship(): THREE.Group {
  const group = new THREE.Group();
  group.name = "aurelia-airship";
  const material = surfaces();
  const workshop = new Workshop(group);

  const hullGeometry = new THREE.SphereGeometry(1, 80, 40).scale(1.52, 0.44, 0.43);
  const positions = hullGeometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  const cream = new THREE.Color("#e7dfc4");
  const patina = new THREE.Color("#85a5a0");
  const weathered = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const waviness = Math.sin(x * 13 + z * 23) * Math.sin(z * 31 - y * 7) * 0.045;
    const age = THREE.MathUtils.clamp(0.2 - y * 0.66 + waviness, 0.03, 0.6);
    weathered.copy(cream).lerp(patina, age);
    colors.set([weathered.r, weathered.g, weathered.b], i * 3);
  }
  hullGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const hull = new THREE.Mesh(hullGeometry, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.72, metalness: 0.12,
  }));
  hull.name = "silk-envelope";
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // Continuous longitudinal seams trace the real envelope surface.
  for (let seam = 0; seam < 16; seam++) {
    const phi = (seam / 16) * Math.PI * 2;
    const points = Array.from({ length: 49 }, (_, index) => {
      const theta = 0.025 + (index / 48) * (Math.PI - 0.05);
      return vector(-1.526 * Math.cos(theta), 0.445 * Math.sin(theta) * Math.cos(phi), 0.435 * Math.sin(theta) * Math.sin(phi));
    });
    workshop.add(line(points, seam % 4 === 0 ? 0.0048 : 0.0027, 64), material.brass);
  }

  const rivetPoints: THREE.Vector3[] = [];
  for (let rib = 1; rib < 14; rib++) {
    const x = -1.5 + (rib / 14) * 3;
    const circumference = Math.sqrt(1 - (x / 1.52) ** 2);
    workshop.add(ringX(x, 0, 0, circumference * 0.435, 0.0027, 0.445 / 0.435), material.brightBrass);
    for (let rivet = 0; rivet < 16; rivet++) {
      const angle = (rivet / 16) * Math.PI * 2;
      rivetPoints.push(vector(x, circumference * 0.448 * Math.cos(angle), circumference * 0.438 * Math.sin(angle)));
    }
  }
  const rivets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.005, 6, 4), material.brightBrass, rivetPoints.length);
  const rivetTransform = new THREE.Matrix4();
  for (let i = 0; i < rivetPoints.length; i++) {
    rivetTransform.makeTranslation(rivetPoints[i].x, rivetPoints[i].y, rivetPoints[i].z);
    rivets.setMatrixAt(i, rivetTransform);
  }
  group.add(rivets);

  workshop.add(sphere(-1.512, 0, 0, 0.025, 0.036, 0.036), material.brass);
  workshop.add(rod(vector(-1.51, 0, 0), vector(-1.68, 0, 0), 0.006, 0.002), material.brass);

  // Four curved stabilizers, with a fine welt and inset control-surface seams.
  const fin = new THREE.Shape();
  fin.moveTo(0.88, 0.20);
  fin.bezierCurveTo(1.06, 0.32, 1.29, 0.52, 1.64, 0.56);
  fin.quadraticCurveTo(1.68, 0.57, 1.64, 0.50);
  fin.lineTo(1.49, 0.035);
  fin.lineTo(1.19, 0.05);
  fin.closePath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    workshop.add(outline(fin, 0.012, 0.004).rotateX(angle), material.teal);
    const rim = fin.getPoints(32).map((p) => vector(p.x, p.y, 0).applyAxisAngle(vector(1, 0, 0), angle));
    workshop.add(line(rim, 0.004, 72, true), material.brass);
    workshop.add(rod(vector(1.40, 0.075, 0).applyAxisAngle(vector(1, 0, 0), angle), vector(1.51, 0.50, 0).applyAxisAngle(vector(1, 0, 0), angle), 0.0025), material.brightBrass);
  }

  // Suspended cabin, with a shaped wooden keel and recessed glazing.
  const cabin = new THREE.Shape();
  cabin.moveTo(-0.64, -0.49);
  cabin.quadraticCurveTo(-0.68, -0.60, -0.51, -0.675);
  cabin.bezierCurveTo(-0.20, -0.745, 0.39, -0.715, 0.56, -0.615);
  cabin.lineTo(0.57, -0.505);
  cabin.quadraticCurveTo(-0.06, -0.47, -0.64, -0.49);
  workshop.add(outline(cabin, 0.235, 0.022), material.teal);
  workshop.add(line([vector(-0.60, -0.64, 0), vector(-0.33, -0.711, 0), vector(0.13, -0.706, 0), vector(0.51, -0.625, 0)], 0.021, 40), material.wood);

  for (const side of [-1, 1]) {
    const z = side * 0.143;
    workshop.add(line([vector(-0.63, -0.50, z), vector(-0.3, -0.491, z), vector(0.28, -0.496, z), vector(0.56, -0.511, z)], 0.011), material.brightBrass);
    workshop.add(line([vector(-0.54, -0.642, z), vector(-0.25, -0.675, z), vector(0.2, -0.662, z), vector(0.52, -0.611, z)], 0.006), material.brass);
    for (let window = 0; window < 9; window++) {
      const x = -0.50 + window * 0.116;
      const y = -0.565;
      workshop.add(sphere(x, y, z, 0.041, 0.044, 0.007), material.glass);
      workshop.add(new THREE.TorusGeometry(0.044, 0.004, 5, 20).scale(0.93, 1, 1).translate(x, y, z + side * 0.004), material.brass);
      workshop.add(rod(vector(x, y - 0.04, z + side * 0.006), vector(x, y + 0.04, z + side * 0.006), 0.002), material.brightBrass);
    }
    for (const x of [-0.46, 0.35]) {
      workshop.add(rod(vector(x, -0.49, side * 0.105), vector(x - 0.10, -0.30, side * 0.29), 0.010), material.brass);
      workshop.add(rod(vector(x + 0.13, -0.50, side * 0.105), vector(x - 0.10, -0.30, side * 0.29), 0.004), material.darkTeal);
    }

    const engineX = 0.41;
    const engineY = -0.36;
    const engineZ = side * 0.46;
    workshop.add(rod(vector(0.40, -0.20, side * 0.30), vector(engineX, engineY, engineZ), 0.016), material.brass);
    workshop.add(sphere(engineX, engineY, engineZ, 0.24, 0.073, 0.079), material.teal);
    for (const offset of [-0.13, -0.08, 0.05, 0.11]) {
      workshop.add(ringX(engineX + offset, engineY, engineZ, 0.070, 0.005), material.brass);
    }
    workshop.add(cylinderX(engineX - 0.19, engineY, engineZ, 0.039, 0.035), material.brightBrass);
    const propeller = makePropeller(side > 0 ? "propeller-port" : "propeller-starboard", material);
    propeller.position.set(engineX - 0.26, engineY, engineZ);
    group.add(propeller);
  }

  // Navigation mast and a little gilt pennant complete the silhouette.
  workshop.add(rod(vector(0.42, 0.38, 0), vector(0.42, 0.59, 0), 0.004), material.brass);
  const flag = new THREE.Shape();
  flag.moveTo(0.42, 0.58);
  flag.lineTo(0.58, 0.55);
  flag.lineTo(0.42, 0.52);
  flag.closePath();
  workshop.add(outline(flag, 0.002, 0), material.ivory);
  workshop.finish();
  group.userData.floatAmplitude = 0.055;
  return group;
}

/** An antique observatory instrument, with a flared lens and curved tripod. */
export function createObservatory(): THREE.Group {
  const group = new THREE.Group();
  group.name = "meridian-observatory";
  const material = surfaces();
  const workshop = new Workshop(group);

  // Splayed wooden legs, brass ferrules, and a triangular tension brace.
  for (let leg = 0; leg < 3; leg++) {
    const angle = (leg / 3) * Math.PI * 2 + Math.PI / 6;
    const direction = vector(Math.cos(angle), 0, Math.sin(angle));
    const top = direction.clone().multiplyScalar(0.14).setY(0.02);
    const knee = direction.clone().multiplyScalar(0.34).setY(-0.48);
    const bottom = direction.clone().multiplyScalar(0.52).setY(-1.05);
    workshop.add(line([top, knee, bottom], 0.025, 24), material.wood);
    workshop.add(rod(bottom.clone().add(vector(0, 0.16, 0)), bottom, 0.028, 0.036), material.brass);
    workshop.add(sphere(bottom.x, bottom.y - 0.013, bottom.z, 0.042, 0.018, 0.042), material.darkTeal);
    workshop.add(rod(vector(0, -0.44, 0), knee, 0.008), material.brass);
    workshop.add(sphere(top.x, top.y, top.z, 0.042, 0.042, 0.042), material.brass);
    // The inlaid strip follows the leg, visible when the instrument turns.
    workshop.add(line([top.clone().add(vector(0.008, 0, 0.015)), knee.clone().add(vector(0.008, 0, 0.015)), bottom.clone().add(vector(0.008, 0, 0.015))], 0.003, 24), material.brightBrass);
  }
  workshop.add(new THREE.CylinderGeometry(0.17, 0.13, 0.09, 40), material.brass);
  workshop.add(ringY(0, 0.058, 0, 0.17, 0.010), material.brightBrass);
  workshop.add(rod(vector(0, 0.04, 0), vector(0, 0.32, 0), 0.064, 0.056, 24), material.teal);
  workshop.add(ringY(0, 0.12, 0, 0.067, 0.012), material.brass);
  workshop.add(ringY(0, 0.29, 0, 0.059, 0.013), material.brass);

  // A graduated declination wheel and fine adjustment knob.
  workshop.add(new THREE.TorusGeometry(0.19, 0.016, 8, 64).translate(0, 0.34, 0), material.brass);
  workshop.add(cylinderX(0, 0.34, 0, 0.031, 0.34), material.brass);
  for (let mark = 0; mark < 48; mark++) {
    const angle = (mark / 48) * Math.PI * 2;
    const inner = mark % 4 === 0 ? 0.15 : 0.163;
    workshop.add(rod(vector(Math.cos(angle) * inner, 0.34 + Math.sin(angle) * inner, 0.009), vector(Math.cos(angle) * 0.18, 0.34 + Math.sin(angle) * 0.18, 0.009), 0.0018), material.darkTeal);
  }
  workshop.add(rod(vector(0.05, 0.23, 0), vector(0.21, 0.16, 0.17), 0.011), material.brass);
  workshop.add(sphere(0.21, 0.16, 0.17, 0.043, 0.043, 0.043), material.wood);
  workshop.finish();

  const telescope = new THREE.Group();
  telescope.name = "telescope-optical-tube";
  telescope.position.y = 0.46;
  telescope.rotation.z = -0.31;
  const optics = new Workshop(telescope);
  optics.add(cylinderX(-0.06, 0, 0, 0.122, 0.91, 0.086), material.teal);
  for (const x of [-0.46, -0.42, -0.17, 0.12, 0.35, 0.39]) {
    const radius = THREE.MathUtils.lerp(0.12, 0.088, (x + 0.46) / 0.85);
    optics.add(ringX(x, 0, 0, radius, x === -0.17 || x === 0.12 ? 0.011 : 0.006), material.brass);
  }
  // Lathed open dew shield: the dark inner bevel gives the lens real depth.
  const hoodPoints = [vector(0.122, -0.03, 0), vector(0.145, 0.03, 0), vector(0.155, 0.19, 0), vector(0.143, 0.19, 0), vector(0.135, 0.04, 0)]
    .map((point) => new THREE.Vector2(point.x, point.y));
  optics.add(new THREE.LatheGeometry(hoodPoints, 48).rotateZ(Math.PI / 2).translate(-0.49, 0, 0), material.brass);
  optics.add(cylinderX(-0.63, 0, 0, 0.14, 0.04), material.darkTeal);
  optics.add(cylinderX(-0.656, 0, 0, 0.125, 0.008), material.glass);
  optics.add(ringX(-0.678, 0, 0, 0.148, 0.009), material.brightBrass);
  optics.add(ringX(-0.663, 0, 0, 0.13, 0.004), material.brass);
  optics.add(cylinderX(0.46, 0, 0, 0.048, 0.16), material.brass);
  optics.add(cylinderX(0.575, 0, 0, 0.034, 0.10), material.darkTeal);
  optics.add(ringX(0.608, 0, 0, 0.036, 0.006), material.brass);
  optics.add(cylinderX(0.632, 0, 0, 0.041, 0.036), material.wood);

  // Finder scope, supports, screws and a slim engraved accent along the barrel.
  optics.add(cylinderX(-0.03, 0.17, 0, 0.025, 0.44), material.brass);
  optics.add(cylinderX(-0.26, 0.17, 0, 0.033, 0.045), material.darkTeal);
  optics.add(cylinderX(-0.284, 0.17, 0, 0.027, 0.002), material.glass);
  for (const x of [-0.13, 0.13]) {
    optics.add(rod(vector(x, 0.07, 0), vector(x, 0.17, 0), 0.009), material.brass);
    optics.add(sphere(x, 0.07, 0.105, 0.013, 0.013, 0.007), material.brightBrass);
  }
  for (const phi of [Math.PI / 3, -Math.PI / 3, Math.PI]) {
    optics.add(rod(vector(-0.40, Math.cos(phi) * 0.118, Math.sin(phi) * 0.118), vector(0.33, Math.cos(phi) * 0.092, Math.sin(phi) * 0.092), 0.0025), material.brightBrass);
  }
  optics.finish();
  group.add(telescope);
  return group;
}

/** A small sailing cutter with a shaped hull, billowing sails and full rigging. */
export function createSailboat(): THREE.Group {
  const group = new THREE.Group();
  group.name = "tideline-cutter";
  const material = surfaces();
  const workshop = new Workshop(group);

  // Loft a curved hull from keel to gunwale instead of using a stretched sphere.
  const hullPositions: number[] = [];
  const hullIndices: number[] = [];
  const lengthSegments = 40;
  const sectionSegments = 20;
  for (let i = 0; i <= lengthSegments; i++) {
    const t = i / lengthSegments;
    const x = -0.9 + t * 1.8;
    const width = Math.pow(Math.sin(t * Math.PI), 0.67) * (0.27 + t * 0.025);
    const sheer = 0.055 + 0.12 * Math.pow(Math.abs(t - 0.5) * 2, 2.8);
    for (let j = 0; j <= sectionSegments; j++) {
      const angle = (j / sectionSegments) * Math.PI;
      hullPositions.push(x, sheer - Math.sin(angle) * 0.25, Math.cos(angle) * width);
      if (i < lengthSegments && j < sectionSegments) {
        const a = i * (sectionSegments + 1) + j;
        const b = a + sectionSegments + 1;
        hullIndices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute("position", new THREE.Float32BufferAttribute(hullPositions, 3));
  hull.setIndex(hullIndices);
  hull.computeVertexNormals();
  workshop.add(hull, material.teal);

  const deck = new THREE.Shape();
  deck.moveTo(-0.89, 0);
  deck.bezierCurveTo(-0.56, -0.35, 0.58, -0.38, 0.9, 0);
  deck.bezierCurveTo(0.58, 0.38, -0.56, 0.35, -0.89, 0);
  workshop.add(new THREE.ShapeGeometry(deck, 32).rotateX(-Math.PI / 2).translate(0, 0.061, 0), material.wood);

  for (const side of [-1, 1]) {
    const rail = Array.from({ length: 33 }, (_, index) => {
      const t = index / 32;
      return vector(-0.9 + t * 1.8, 0.062 + 0.12 * Math.pow(Math.abs(t - 0.5) * 2, 2.8), side * Math.pow(Math.sin(t * Math.PI), 0.67) * (0.27 + t * 0.025));
    });
    workshop.add(line(rail, 0.014, 48), material.brightBrass);
    const waterline = rail.map((p) => vector(p.x * 0.94, p.y - 0.11, p.z * 0.93));
    workshop.add(line(waterline, 0.009, 48), material.ivory);
    for (let plank = 0; plank < 4; plank++) {
      const height = 0.035 + plank * 0.042;
      const seam = rail.map((p) => vector(p.x * (1 - plank * 0.035), p.y - height, p.z * (1 - plank * 0.085)));
      workshop.add(line(seam, 0.002, 40), material.darkTeal);
    }
    for (const x of [-0.5, -0.25, 0.0, 0.25, 0.50]) {
      const t = (x + 0.9) / 1.8;
      const z = side * Math.pow(Math.sin(t * Math.PI), 0.67) * (0.27 + t * 0.025);
      workshop.add(rod(vector(x, 0.07, z), vector(x, 0.18, z), 0.005), material.brass);
    }
  }
  // Deck boards and a modest cabin with bronze-framed portholes.
  for (let board = -4; board <= 4; board++) {
    const z = board * 0.045;
    const length = 0.76 - Math.abs(board) * 0.055;
    workshop.add(rod(vector(-length, 0.064, z), vector(length, 0.064, z), 0.0018), material.brightBrass);
  }
  workshop.add(new THREE.BoxGeometry(0.34, 0.14, 0.27).translate(0.28, 0.135, 0), material.ivory);
  workshop.add(new THREE.BoxGeometry(0.38, 0.025, 0.30).translate(0.28, 0.216, 0), material.teal);
  for (const side of [-1, 1]) {
    for (const x of [0.19, 0.34]) {
      workshop.add(sphere(x, 0.148, side * 0.139, 0.033, 0.031, 0.004), material.glass);
      workshop.add(new THREE.TorusGeometry(0.033, 0.004, 5, 20).translate(x, 0.148, side * 0.142), material.brass);
    }
  }

  const mastX = -0.16;
  workshop.add(rod(vector(mastX, 0.055, 0), vector(mastX, 1.76, 0), 0.023, 0.011, 12), material.wood);
  workshop.add(rod(vector(mastX - 0.025, 0.4, 0), vector(0.78, 0.34, 0.045), 0.014, 0.009), material.wood);
  workshop.add(rod(vector(-0.74, 0.14, 0), vector(-1.11, 0.22, 0), 0.014, 0.007), material.wood);
  for (const y of [0.22, 0.4, 0.75, 1.1, 1.5]) {
    workshop.add(ringY(mastX, y, 0, 0.026 - y * 0.006, 0.003), material.brass);
  }

  function sail(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, billow: number) {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    const divisions = 20;
    const point = (u: number, v: number) => {
      const p = a.clone().multiplyScalar(1 - u - v).addScaledVector(b, u).addScaledVector(c, v);
      p.z += Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * Math.sin(Math.PI * (u + v)) * billow;
      return p;
    };
    for (let row = 0; row <= divisions; row++) {
      for (let column = 0; column <= divisions; column++) {
        const u = row / divisions;
        const v = (column / divisions) * (1 - u);
        const p = point(u, v);
        positions.push(p.x, p.y, p.z);
        if (row < divisions && column < divisions) {
          const start = row * (divisions + 1) + column;
          const next = start + divisions + 1;
          indices.push(start, next, start + 1, next, next + 1, start + 1);
        }
      }
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    workshop.add(geometry, material.canvas);
    for (const [start, end] of [[a, b], [b, c], [c, a]]) {
      workshop.add(rod(start, end, 0.003), material.rope);
    }
    // Narrow curved stitching shows the sail's panel construction.
    for (let seam = 1; seam < 6; seam++) {
      const u = seam / 6;
      const curve = Array.from({ length: 17 }, (_, index) => point(u, (index / 16) * (1 - u)));
      workshop.add(line(curve, 0.0016, 24), material.rope);
    }
  }

  sail(vector(mastX + 0.03, 1.64, 0), vector(mastX + 0.03, 0.43, 0), vector(0.75, 0.38, 0.045), 0.31);
  sail(vector(mastX - 0.05, 1.60, 0), vector(-1.01, 0.25, 0), vector(mastX - 0.05, 0.46, 0.01), 0.18);
  for (const attachment of [vector(-1.08, 0.23, 0), vector(0.83, 0.13, 0), vector(-0.1, 0.08, -0.25), vector(-0.1, 0.08, 0.25)]) {
    workshop.add(rod(vector(mastX, 1.71, 0), attachment, 0.0025), material.rope);
  }
  workshop.add(rod(vector(0.76, 0.35, 0.045), vector(0.65, 0.07, 0.16), 0.0025), material.rope);
  workshop.add(sphere(mastX, 1.772, 0, 0.018, 0.018, 0.018), material.brightBrass);
  workshop.finish();
  group.userData.floatAmplitude = 0.025;
  return group;
}
