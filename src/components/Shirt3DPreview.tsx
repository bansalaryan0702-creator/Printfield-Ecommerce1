import React, { Suspense, useMemo, useState, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture, Decal, Center, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Loader2 } from "lucide-react";
import { getColorStyle } from "@/src/utils/colorUtils";

function resolveHexColor(colorInput: any): string {
  if (!colorInput) return "#ffffff";
  if (typeof colorInput === "object") {
    if (colorInput.hex && typeof colorInput.hex === "string" && colorInput.hex.startsWith("#")) {
      return colorInput.hex;
    }
    if (colorInput.name) {
      colorInput = colorInput.name;
    } else {
      return "#ffffff";
    }
  }
  const str = String(colorInput).trim();
  if (str.startsWith("#") || str.startsWith("rgb")) return str;

  const style = getColorStyle(str);
  if (style.background) {
    if (style.background.startsWith("#") || style.background.startsWith("rgb")) {
      return style.background;
    }
    const match = style.background.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
    if (match) return match[0];
  }
  return "#ffffff";
}

export type CollarType = 'polo' | 'round-neck';

interface Shirt3DPreviewProps {
  color: string;
  artworks: any;
  activePlacement?: string;
  isPolo?: boolean;
}

// Camera Rig for Placement Focus
function CameraRig({ activePlacement, controlsRef }: { activePlacement?: string; controlsRef: React.RefObject<any> }) {
  const { targetPos, lookTarget } = useMemo(() => {
    switch (activePlacement) {
      case 'back-full':
      case 'back':
        return {
          targetPos: new THREE.Vector3(0, 0.52, -0.85),
          lookTarget: new THREE.Vector3(0, 0.52, -0.06)
        };
      case 'sleeve-left':
      case 'left-sleeve':
      case 'sleeve_left':
        return {
          targetPos: new THREE.Vector3(0.55, 0.598, 0.15),
          lookTarget: new THREE.Vector3(0.138, 0.598, -0.015)
        };
      case 'sleeve-right':
      case 'right-sleeve':
      case 'sleeve_right':
        return {
          targetPos: new THREE.Vector3(-0.55, 0.598, 0.15),
          lookTarget: new THREE.Vector3(-0.138, 0.598, -0.015)
        };
      case 'front-chest':
      case 'chest':
      case 'left-chest':
        return {
          targetPos: new THREE.Vector3(0.20, 0.58, 0.65),
          lookTarget: new THREE.Vector3(0.045, 0.58, 0.054)
        };
      default:
        return {
          targetPos: new THREE.Vector3(0, 0.53, 0.85),
          lookTarget: new THREE.Vector3(0, 0.53, 0)
        };
    }
  }, [activePlacement]);

  useFrame((state) => {
    state.camera.position.lerp(targetPos, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(lookTarget, 0.08);
      controlsRef.current.update();
    } else {
      state.camera.lookAt(lookTarget);
    }
  });

  return null;
}

// Procedural fabric pique bump map for authentic cotton texture
function useFabricPiqueMap() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 128, 128);

    const imgData = ctx.getImageData(0, 0, 128, 128);
    const data = imgData.data;

    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const i = (y * 128 + x) * 4;
        const isPattern = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
        const base = isPattern ? 148 : 112;
        const val = Math.min(255, Math.max(0, base + (Math.random() - 0.5) * 14));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(18, 18);
    return texture;
  }, []);
}

// High-fidelity Photorealistic Polo Collar & Placket Engine
function CustomCollarEngine({ color }: { color: string }) {
  const shirtColor = useMemo(() => new THREE.Color(color), [color]);
  
  const shadowColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.35);
    return c;
  }, [color]);

  const buttonColor = useMemo(() => new THREE.Color("#fbfbf8"), []);
  const piqueMap = useFabricPiqueMap();

  // 1. Left Polo Wing Geometry
  const leftWingGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const s = 1;
    const uSegments = 36;
    const vSegments = 12;
    
    const verts: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let uIdx = 0; uIdx <= uSegments; uIdx++) {
      const u = uIdx / uSegments;
      const angle = u * Math.PI * 0.73; 
      
      const rFold = 0.0515 + 0.002 * Math.cos(angle * 1.5);
      const xFold = rFold * Math.sin(angle) * s;
      const zFold = -0.012 + rFold * Math.cos(angle);
      const yFold = 0.246 - u * 0.058;

      const collarWidth = 0.035 + u * 0.022; 
      
      const outX = Math.sin(angle + 0.38) * s;
      const outZ = Math.cos(angle + 0.12);
      
      const tipFlareX = u > 0.72 ? (u - 0.72) * 0.014 * s : 0;
      const tipFlareZ = u > 0.72 ? (u - 0.72) * 0.032 : 0;
      const tipDropY  = u > 0.72 ? (u - 0.72) * 0.028 : 0;

      const xOuter = xFold + collarWidth * outX * 0.95 + tipFlareX;
      const zOuter = zFold + collarWidth * outZ * 0.88 + u * 0.024 + tipFlareZ;
      const yOuter = yFold - 0.006 - u * 0.046 - tipDropY;

      for (let vIdx = 0; vIdx <= vSegments; vIdx++) {
        const v = vIdx / vSegments;
        const fabricRoll = Math.sin(v * Math.PI) * 0.0045;
        
        const px = THREE.MathUtils.lerp(xFold, xOuter, v);
        const py = THREE.MathUtils.lerp(yFold, yOuter, Math.pow(v, 0.86)) + fabricRoll * 0.25;
        const pz = THREE.MathUtils.lerp(zFold, zOuter, v) + fabricRoll;

        verts.push(px, py, pz);
        uvs.push(u * 2, v);
      }
    }

    for (let u = 0; u < uSegments; u++) {
      for (let v = 0; v < vSegments; v++) {
        const i00 = u * (vSegments + 1) + v;
        const i01 = i00 + 1;
        const i10 = (u + 1) * (vSegments + 1) + v;
        const i11 = i10 + 1;

        indices.push(i00, i10, i01);
        indices.push(i01, i10, i11);
      }
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 2. Right Polo Wing Geometry
  const rightWingGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const s = -1;
    const uSegments = 36;
    const vSegments = 12;
    
    const verts: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let uIdx = 0; uIdx <= uSegments; uIdx++) {
      const u = uIdx / uSegments;
      const angle = u * Math.PI * 0.73; 
      
      const rFold = 0.0515 + 0.002 * Math.cos(angle * 1.5);
      const xFold = rFold * Math.sin(angle) * s;
      const zFold = -0.012 + rFold * Math.cos(angle);
      const yFold = 0.246 - u * 0.058;

      const collarWidth = 0.035 + u * 0.022; 
      
      const outX = Math.sin(angle + 0.38) * s;
      const outZ = Math.cos(angle + 0.12);
      
      const tipFlareX = u > 0.72 ? (u - 0.72) * 0.014 * s : 0;
      const tipFlareZ = u > 0.72 ? (u - 0.72) * 0.032 : 0;
      const tipDropY  = u > 0.72 ? (u - 0.72) * 0.028 : 0;

      const xOuter = xFold + collarWidth * outX * 0.95 + tipFlareX;
      const zOuter = zFold + collarWidth * outZ * 0.88 + u * 0.024 + tipFlareZ;
      const yOuter = yFold - 0.006 - u * 0.046 - tipDropY;

      for (let vIdx = 0; vIdx <= vSegments; vIdx++) {
        const v = vIdx / vSegments;
        const fabricRoll = Math.sin(v * Math.PI) * 0.0045;
        
        const px = THREE.MathUtils.lerp(xFold, xOuter, v);
        const py = THREE.MathUtils.lerp(yFold, yOuter, Math.pow(v, 0.86)) + fabricRoll * 0.25;
        const pz = THREE.MathUtils.lerp(zFold, zOuter, v) + fabricRoll;

        verts.push(px, py, pz);
        uvs.push(u * 2, v);
      }
    }

    for (let u = 0; u < uSegments; u++) {
      for (let v = 0; v < vSegments; v++) {
        const i00 = u * (vSegments + 1) + v;
        const i01 = i00 + 1;
        const i10 = (u + 1) * (vSegments + 1) + v;
        const i11 = i10 + 1;

        indices.push(i00, i01, i10);
        indices.push(i01, i11, i10);
      }
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Under-Collar Soft Ambient Occlusion Shadow Mesh
  const shadowUnderCollarGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const segments = 32;
    const verts: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = (t - 0.5) * Math.PI * 1.4;
      const r = 0.052;
      const x = r * Math.sin(angle);
      const z = -0.012 + r * Math.cos(angle);
      const y = 0.238 - Math.abs(t - 0.5) * 0.08;

      const outerX = x * 1.45;
      const outerZ = z + 0.030;
      const outerY = y - 0.015;

      verts.push(x, y - 0.003, z);
      verts.push(outerX, outerY - 0.003, outerZ);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 3. Standing Inner Neck Band
  const standingInnerBandGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const segments = 28;
    const verts: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = (t - 0.5) * Math.PI * 1.45;

      const r = 0.052;
      const x = r * Math.sin(angle);
      const z = -0.014 + r * Math.cos(angle);

      const yBase = 0.185 + 0.046 * (1 + Math.cos(angle)) * 0.5;
      const yTop = yBase + 0.024;

      verts.push(x, yBase, z);
      verts.push(x, yTop, z);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;

      indices.push(a, b, c);
      indices.push(c, b, d);
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 4. Central Button Placket Box
  const placketGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const w = 0.014;
    const z = 0.128;
    const thick = 0.003;

    const verts: number[] = [];
    const indices: number[] = [];

    function addQuad(p0: number[], p1: number[], p2: number[], p3: number[]) {
      const idx = verts.length / 3;
      verts.push(...p0, ...p1, ...p2, ...p3);
      indices.push(idx, idx + 1, idx + 2, idx, idx + 2, idx + 3);
    }

    const b0_f = [-w, 0.048, z + thick];
    const b1_f = [ w, 0.048, z + thick];
    const b2_f = [ w, 0.142, z - 0.002 + thick];
    const b3_f = [-w, 0.142, z - 0.002 + thick];
    addQuad(b0_f, b1_f, b2_f, b3_f);

    const l0 = [0.001, 0.142, z - 0.002 + thick];
    const l1 = [w + 0.001, 0.142, z - 0.002 + thick];
    const l2 = [w + 0.008, 0.188, z - 0.010 + thick];
    const l3 = [0.006, 0.188, z - 0.010 + thick];
    addQuad(l0, l1, l2, l3);

    const r0 = [-w - 0.001, 0.142, z - 0.002 + thick];
    const r1 = [-0.001, 0.142, z - 0.002 + thick];
    const r2 = [-0.006, 0.188, z - 0.010 + thick];
    const r3 = [-w - 0.008, 0.188, z - 0.010 + thick];
    addQuad(r0, r1, r2, r3);

    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 5. Dark Inner Neck Cavity Backing
  const innerNeckBackingGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const segments = 24;
    const verts: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = (t - 0.5) * Math.PI * 1.40;
      const r = 0.051;
      const x = r * Math.sin(angle);
      const z = -0.015 + r * Math.cos(angle);

      const yTop = 0.250 - 0.020 * (1 - Math.cos(angle));
      const yBottom = 0.040;

      verts.push(x, yTop, z);
      verts.push(x, yBottom, z);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 6. Sleeve Cuffs
  const leftSleeveCuffGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const segments = 28;
    const verts: number[] = [];
    const indices: number[] = [];
    const cx = 0.235;
    const cy = 0.055;
    const cz = -0.010;
    const r = 0.049;
    const height = 0.018;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const x = cx + r * Math.cos(angle) * 0.35;
      const z = cz + r * Math.sin(angle);
      const yBot = cy - height * 0.5;
      const yTop = cy + height * 0.5;
      verts.push(x, yBot, z);
      verts.push(x, yTop, z);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  const rightSleeveCuffGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const segments = 28;
    const verts: number[] = [];
    const indices: number[] = [];
    const cx = -0.235;
    const cy = 0.055;
    const cz = -0.010;
    const r = 0.049;
    const height = 0.018;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const x = cx + r * Math.cos(angle) * 0.35;
      const z = cz + r * Math.sin(angle);
      const yBot = cy - height * 0.5;
      const yTop = cy + height * 0.5;
      verts.push(x, yBot, z);
      verts.push(x, yTop, z);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Dark Inner Neck Cavity */}
      <mesh geometry={innerNeckBackingGeom}>
        <meshBasicMaterial color={shadowColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Under Collar Soft Shadow */}
      <mesh geometry={shadowUnderCollarGeom}>
        <meshBasicMaterial color="#000000" opacity={0.35} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Standing Inner Neck Band */}
      <mesh geometry={standingInnerBandGeom} castShadow receiveShadow>
        <meshStandardMaterial color={shirtColor} bumpMap={piqueMap || undefined} bumpScale={0.0008} roughness={0.68} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>

      {/* Folded Polo Collar Wings */}
      <mesh geometry={leftWingGeom} castShadow receiveShadow>
        <meshStandardMaterial color={shirtColor} bumpMap={piqueMap || undefined} bumpScale={0.001} roughness={0.65} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rightWingGeom} castShadow receiveShadow>
        <meshStandardMaterial color={shirtColor} bumpMap={piqueMap || undefined} bumpScale={0.001} roughness={0.65} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>

      {/* Central Placket */}
      <mesh geometry={placketGeom} castShadow receiveShadow>
        <meshStandardMaterial color={shirtColor} bumpMap={piqueMap || undefined} bumpScale={0.0008} roughness={0.68} metalness={0.02} />
      </mesh>
      
      {/* Placket Seam Shadow */}
      <mesh position={[0, 0.098, 0.130]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.001, 0.090, 0.001]} />
        <meshBasicMaterial color={shadowColor} opacity={0.6} transparent />
      </mesh>

      {/* Pearl Buttons */}
      {[
        { y: 0.130, z: 0.127 },
        { y: 0.078, z: 0.130 }
      ].map((btn, i) => (
        <group key={i} position={[0, btn.y, btn.z + 0.004]} rotation={[0.22, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0035, 0.0035, 0.0018, 16]} />
            <meshStandardMaterial color={buttonColor} roughness={0.15} metalness={0.10} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}>
            <torusGeometry args={[0.0025, 0.0004, 8, 16]} />
            <meshStandardMaterial color="#c0c0b8" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Sleeve Ribbed Cuffs */}
      <mesh geometry={leftSleeveCuffGeom} castShadow receiveShadow>
        <meshStandardMaterial color={shirtColor} bumpMap={piqueMap || undefined} bumpScale={0.0012} roughness={0.70} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rightSleeveCuffGeom} castShadow receiveShadow>
        <meshStandardMaterial color={shirtColor} bumpMap={piqueMap || undefined} bumpScale={0.0012} roughness={0.70} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Crew Neck Ribbed Ring for Round Neck Mode
function CrewNeckCollarEngine({ color }: { color: string }) {
  const shirtColor = useMemo(() => new THREE.Color(color), [color]);
  const piqueMap = useFabricPiqueMap();

  const crewNeckGeom = useMemo(() => {
    const geom = new THREE.TorusGeometry(0.062, 0.008, 12, 36);
    geom.rotateX(Math.PI / 2.3);
    geom.scale(1.2, 1.0, 1.0);
    geom.translate(0, 0.185, 0.015);
    return geom;
  }, []);

  return (
    <mesh geometry={crewNeckGeom} castShadow receiveShadow>
      <meshStandardMaterial color={shirtColor} bumpMap={piqueMap || undefined} bumpScale={0.001} roughness={0.65} metalness={0.02} />
    </mesh>
  );
}

// Procedural 3D Shirt Body Mesh Generator
function buildProceduralShirtGeometry(isPolo: boolean) {
  const geometries: THREE.BufferGeometry[] = [];

  // 1. Torso Geometry
  const torsoU = 48;
  const torsoV = 32;
  const torsoVerts: number[] = [];
  const torsoUVs: number[] = [];
  const torsoIndices: number[] = [];

  for (let vIdx = 0; vIdx <= torsoV; vIdx++) {
    const v = vIdx / torsoV; // 0 at hem (-0.38), 1 at top (0.22)
    const y = THREE.MathUtils.lerp(-0.38, 0.22, v);

    const w = 0.188 + Math.sin(v * Math.PI) * 0.012;
    const d = 0.108 + Math.sin(v * Math.PI) * 0.010;

    for (let uIdx = 0; uIdx <= torsoU; uIdx++) {
      const u = uIdx / torsoU;
      const angle = u * Math.PI * 2;

      let x = w * Math.sin(angle);
      let z = d * Math.cos(angle);
      let curY = y;

      // Flatten front (z > 0) and back (z < 0) slightly for human torso shape
      z *= 0.88 + 0.12 * Math.abs(Math.cos(angle));

      // Neck opening carving at top
      if (v > 0.78) {
        const t = (v - 0.78) / 0.22;
        const distFromCenter = Math.sqrt((x / 0.08) ** 2 + (z / 0.065) ** 2);
        if (distFromCenter < 1.0) {
          const depth = (1 - distFromCenter) * t;
          if (z > 0 && isPolo) {
            curY -= depth * 0.14; // deep throat drop for polo placket
            z -= depth * 0.025;
          } else if (z > 0 && !isPolo) {
            curY -= depth * 0.08; // crew neck front drop
          } else {
            curY -= depth * 0.03; // back neck drop
          }
        }
      }

      // Micro fabric drape / folds
      const fold = Math.sin(u * Math.PI * 6 + v * 8) * 0.0015 * (1 - v);

      torsoVerts.push(x, curY, z + fold);
      torsoUVs.push(u, v);
    }
  }

  for (let v = 0; v < torsoV; v++) {
    for (let u = 0; u < torsoU; u++) {
      const i00 = v * (torsoU + 1) + u;
      const i01 = i00 + 1;
      const i10 = (v + 1) * (torsoU + 1) + u;
      const i11 = i10 + 1;
      torsoIndices.push(i00, i10, i01);
      torsoIndices.push(i01, i10, i11);
    }
  }

  const torsoGeom = new THREE.BufferGeometry();
  torsoGeom.setAttribute("position", new THREE.Float32BufferAttribute(torsoVerts, 3));
  torsoGeom.setAttribute("uv", new THREE.Float32BufferAttribute(torsoUVs, 2));
  torsoGeom.setIndex(torsoIndices);
  torsoGeom.computeVertexNormals();
  geometries.push(torsoGeom);

  // 2. Left Sleeve
  const lSleeveGeom = new THREE.CylinderGeometry(0.062, 0.052, 0.16, 24, 8, true);
  lSleeveGeom.rotateZ(-Math.PI * 0.28);
  lSleeveGeom.rotateY(-Math.PI * 0.05);
  lSleeveGeom.translate(0.225, 0.08, 0.0);
  geometries.push(lSleeveGeom);

  // 3. Right Sleeve
  const rSleeveGeom = new THREE.CylinderGeometry(0.062, 0.052, 0.16, 24, 8, true);
  rSleeveGeom.rotateZ(Math.PI * 0.28);
  rSleeveGeom.rotateY(Math.PI * 0.05);
  rSleeveGeom.translate(-0.225, 0.08, 0.0);
  geometries.push(rSleeveGeom);

  return mergeBufferGeometries(geometries);
}

function mergeBufferGeometries(geoms: THREE.BufferGeometry[]) {
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let offset = 0;

  for (const g of geoms) {
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const idx = g.index;

    for (let i = 0; i < pos.count; i++) {
      verts.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (uv) uvs.push(uv.getX(i), uv.getY(i));
      else uvs.push(0, 0);
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push(idx.getX(i) + offset);
      }
    }
    offset += pos.count;
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  out.setIndex(indices);
  out.computeVertexNormals();
  return out;
}

function ShirtModel({ 
  color, 
  artworks, 
  isPolo = false,
}: { 
  color: string; 
  artworks: any; 
  isPolo?: boolean;
}) {
  const { nodes } = useGLTF("/models/shirt_baked.glb", false) as any;
  const piqueMap = useFabricPiqueMap();
  const targetHex = useMemo(() => resolveHexColor(color), [color]);
  const shirtColor = useMemo(() => new THREE.Color(targetHex), [targetHex]);

  const matRef0 = React.useRef<THREE.MeshStandardMaterial>(null);
  const matRef1 = React.useRef<THREE.MeshStandardMaterial>(null);
  const matRef2 = React.useRef<THREE.MeshStandardMaterial>(null);
  const matRef3 = React.useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (matRef0.current) matRef0.current.color.lerp(shirtColor, 0.25);
    if (matRef1.current) matRef1.current.color.lerp(shirtColor, 0.25);
    if (matRef2.current) matRef2.current.color.lerp(shirtColor, 0.25);
    if (matRef3.current) matRef3.current.color.lerp(shirtColor, 0.25);
  });

  const frontFullArtwork = artworks?.['front-full'] || artworks?.['front'] || artworks?.['front_full'];
  const backFullArtwork = artworks?.['back-full'] || artworks?.['back'] || artworks?.['back_full'];
  const frontChestArtwork = artworks?.['front-chest'] || artworks?.['chest'] || artworks?.['left-chest'] || artworks?.['left_chest'];
  const sleeveLeftArtwork = artworks?.['sleeve-left'] || artworks?.['left-sleeve'] || artworks?.['sleeve_left'] || artworks?.['left_sleeve'];
  const sleeveRightArtwork = artworks?.['sleeve-right'] || artworks?.['right-sleeve'] || artworks?.['sleeve_right'] || artworks?.['right_sleeve'];

  return (
    
    <group dispose={null}>
      {/* 1. Collar/Ribbing Mesh */}
      {nodes['Node-Mesh'] && (
        <mesh geometry={nodes['Node-Mesh'].geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            ref={matRef0}
            color={shirtColor} 
            roughness={0.7} 
            metalness={0.02} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}

      {/* 2. Main Shirt Body Mesh with Live Artwork Decals */}
      {nodes['Node-Mesh_1'] && (
        <mesh geometry={nodes['Node-Mesh_1'].geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            ref={matRef1}
            color={shirtColor} 
            bumpMap={piqueMap || undefined} 
            bumpScale={0.0008} 
            roughness={0.65} 
            metalness={0.02} 
            side={THREE.DoubleSide} 
          />
          {frontFullArtwork?.previewUrl && (
            <SafeDecalArtwork 
    url={frontFullArtwork.previewUrl}
    position={[0, 0.52, 0.056]}
    rotation={[0, 0, 0]}
    baseScale={0.16}
    scaleMultiplier={frontFullArtwork.scale}
    offsetX={frontFullArtwork.x}
    offsetY={frontFullArtwork.y}
  />
          )}
          {frontChestArtwork?.previewUrl && (
            <SafeDecalArtwork 
    url={frontChestArtwork.previewUrl}
    position={[0.045, 0.58, 0.054]}
    rotation={[0, 0, 0]}
    baseScale={0.042}
    scaleMultiplier={frontChestArtwork.scale}
    offsetX={frontChestArtwork.x}
    offsetY={frontChestArtwork.y}
  />
          )}
          {backFullArtwork?.previewUrl && (
            <SafeDecalArtwork 
    url={backFullArtwork.previewUrl}
    position={[0, 0.52, -0.062]}
    rotation={[0, Math.PI, 0]}
    baseScale={0.16}
    scaleMultiplier={backFullArtwork.scale}
    offsetX={backFullArtwork.x}
    offsetY={backFullArtwork.y}
  />
          )}
          {sleeveLeftArtwork?.previewUrl && (
            <SafeDecalArtwork 
    url={sleeveLeftArtwork.previewUrl}
    position={[0.138, 0.598, -0.015]}
    rotation={[0, Math.PI / 2, 0]}
    baseScale={0.026}
    scaleMultiplier={sleeveLeftArtwork.scale}
    offsetX={sleeveLeftArtwork.x}
    offsetY={sleeveLeftArtwork.y}
  />
          )}
          {sleeveRightArtwork?.previewUrl && (
            <SafeDecalArtwork 
    url={sleeveRightArtwork.previewUrl}
    position={[-0.138, 0.598, -0.015]}
    rotation={[0, -Math.PI / 2, 0]}
    baseScale={0.026}
    scaleMultiplier={sleeveRightArtwork.scale}
    offsetX={sleeveRightArtwork.x}
    offsetY={sleeveRightArtwork.y}
  />
          )}
        </mesh>
      )}

      {/* 3. Inner Label Area Mesh */}
      {nodes['Node-Mesh_2'] && (
        <mesh geometry={nodes['Node-Mesh_2'].geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            ref={matRef2}
            color={shirtColor} 
            roughness={0.8} 
            metalness={0.02} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}

      {/* 4. Additional Stitching/Details Mesh */}
      {nodes['Node-Mesh_3'] && (
        <mesh geometry={nodes['Node-Mesh_3'].geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            ref={matRef3}
            color={shirtColor} 
            roughness={0.7} 
            metalness={0.02} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}
    </group>

  );
}

useGLTF.preload("/models/shirt_baked.glb");

function SafeDecalArtwork(props: { url?: string; position: [number, number, number]; rotation: [number, number, number]; baseScale: number; scaleMultiplier?: number; offsetX?: number; offsetY?: number }) {
  if (!props.url) return null;
  return (
    <Suspense fallback={null}>
      <DecalArtwork 
        url={props.url} 
        position={props.position} 
        rotation={props.rotation} 
        baseScale={props.baseScale} 
        scaleMultiplier={props.scaleMultiplier || 1}
        offsetX={props.offsetX || 0}
        offsetY={props.offsetY || 0}
      />
    </Suspense>
  );
}

function DecalArtwork({ url, position, rotation, baseScale, scaleMultiplier = 1, offsetX = 0, offsetY = 0 }: { url: string; position: [number, number, number]; rotation: [number, number, number]; baseScale: number; scaleMultiplier?: number; offsetX?: number; offsetY?: number }) {
  const texture = useTexture(url);
  texture.anisotropy = 16;
  const scale = useMemo(() => {
    const depth = 0.08;
    const img = texture.image as any;
    let finalScale = baseScale * scaleMultiplier;
    if (img && img.width && img.height) {
      const aspect = img.width / img.height;
      if (aspect > 1) {
        return [finalScale, finalScale / aspect, depth];
      } else {
        return [finalScale * aspect, finalScale, depth];
      }
    }
    return [finalScale, finalScale, depth];
  }, [texture, baseScale, scaleMultiplier]);

  // Rough conversion: 100px in 2D = ~0.08 units in 3D (adjust as needed based on scale)
  const adjustedPosition: [number, number, number] = [
    position[0] + (offsetX * 0.0008),
    position[1] - (offsetY * 0.0008), // Y axis is usually inverted in 3D vs 2D HTML
    position[2]
  ];

  return (
    <Decal 
      position={adjustedPosition} 
      rotation={rotation} 
      scale={scale as any} 
      map={texture} 
      depthTest={true}
    />
  );
}

function CanvasLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-xs z-10 pointer-events-none">
      <Loader2 className="w-7 h-7 text-gray-600 animate-spin mb-2" />
      <p className="text-xs font-medium text-gray-600">Loading Photorealistic 3D Model...</p>
    </div>
  );
}

class ThreeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error("3D Preview Error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center text-gray-700">
          <p className="text-sm font-medium mb-1">3D Studio View Unavailable</p>
          <p className="text-xs text-gray-500">Viewing standard product photo mode.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Shirt3DPreview({ 
  color, 
  artworks, 
  activePlacement, 
  isPolo = false,
}: Shirt3DPreviewProps) {
  const [loading, setLoading] = useState(true);
  const controlsRef = React.useRef<any>(null);

  return (
    <ThreeErrorBoundary>
      <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-gradient-to-b from-slate-100 via-slate-200/80 to-slate-300 overflow-hidden rounded-2xl min-h-[440px] shadow-inner border border-slate-200 flex flex-col">
        {loading && <CanvasLoader />}
        
        <Canvas shadows camera={{ position: [0, 0.53, 0.85], fov: 45 }} onCreated={() => setLoading(false)}>
          <ambientLight intensity={0.65} />
          <hemisphereLight intensity={0.4} groundColor="#1e293b" color="#ffffff" />
          <directionalLight 
            position={[1.8, 3.2, 2.2]} 
            intensity={1.2} 
            castShadow 
          />
          <directionalLight position={[-1.8, 1.2, 1.8]} intensity={0.45} />
          <directionalLight position={[0, 2.5, -2.5]} intensity={0.55} />
          
          <CameraRig activePlacement={activePlacement} controlsRef={controlsRef} />
          <OrbitControls 
            ref={controlsRef}
            enableZoom={true} 
            enablePan={false}
            target={[0, 0.53, 0]}
            maxPolarAngle={Math.PI / 2 + 0.15} 
            minPolarAngle={Math.PI / 4} 
            minDistance={0.5}
            maxDistance={3.0}
          />
          
          <Suspense fallback={null}>
            <ShirtModel 
              color={color || '#ffffff'} 
              artworks={artworks} 
              isPolo={isPolo} 
            />
          </Suspense>
          
          <ContactShadows 
            position={[0, 0.38, 0]} 
            opacity={0.65} 
            scale={4.5} 
            blur={1.8} 
            far={1.0} 
          />
        </Canvas>
      </div>
    </ThreeErrorBoundary>
  );
}
