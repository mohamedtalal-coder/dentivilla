"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  gingivaGeometry,
  placeArch,
  toothGeometry,
  type ArchName,
  type PlacedTooth,
} from "@/lib/dental-anatomy";

const OPEN_ANGLE = 0.95; // radians each arch rotates about the hinge
const HINGE_Z = -32;

const SELECTED_TINT = new THREE.Color("#7fd6d2");
const BASE_TINT = new THREE.Color("#ffffff");

function Tooth({
  tooth,
  selected,
  hovered,
  onHover,
  onSelect,
}: {
  tooth: PlacedTooth;
  selected: boolean;
  hovered: boolean;
  onHover: (fdi: string | null) => void;
  onSelect: (fdi: string) => void;
}) {
  const geometry = useMemo(() => toothGeometry(tooth.spec), [tooth.spec]);

  return (
    <group position={tooth.position} rotation={[0, tooth.yaw, 0]}>
      <mesh
        geometry={geometry}
        rotation={[tooth.inclination, 0, 0]}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          onHover(tooth.fdi);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onSelect(tooth.fdi);
        }}
      >
        <meshPhysicalMaterial
          vertexColors
          color={selected ? SELECTED_TINT : BASE_TINT}
          emissive={selected ? "#1c8f8c" : hovered ? "#2ba6a4" : "#000000"}
          emissiveIntensity={selected ? 0.35 : hovered ? 0.22 : 0}
          roughness={0.3}
          clearcoat={0.6}
          clearcoatRoughness={0.22}
          sheen={0.25}
          sheenColor="#ffffff"
        />
      </mesh>
    </group>
  );
}

function Arch({
  arch,
  selected,
  hovered,
  onHover,
  onSelect,
}: {
  arch: ArchName;
  selected: string[];
  hovered: string | null;
  onHover: (fdi: string | null) => void;
  onSelect: (fdi: string) => void;
}) {
  const teeth = useMemo(() => placeArch(arch), [arch]);
  const gum = useMemo(() => gingivaGeometry(arch), [arch]);
  const isUpper = arch === "upper";

  return (
    // hinge at the back of the arch; the front opens away from the other arch
    <group position={[0, isUpper ? 2 : -2, HINGE_Z]} rotation={[isUpper ? -OPEN_ANGLE : OPEN_ANGLE, 0, 0]}>
      <group position={[0, 0, -HINGE_Z]} rotation={[0, 0, isUpper ? Math.PI : 0]}>
        <mesh geometry={gum}>
          <meshPhysicalMaterial
            color="#d9827f"
            roughness={0.48}
            clearcoat={0.35}
            clearcoatRoughness={0.4}
            sheen={0.6}
            sheenColor="#ffc2bd"
          />
        </mesh>
        {teeth.map((tooth) => (
          <Tooth
            key={tooth.fdi}
            tooth={tooth}
            selected={selected.includes(tooth.fdi)}
            hovered={hovered === tooth.fdi}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}
      </group>
    </group>
  );
}

export type Jaw3DProps = {
  selected: string[];
  onToggle: (fdi: string) => void;
  onHoverChange?: (fdi: string | null) => void;
  className?: string;
  /** initial camera tilt: "front" for booking, "angled" for education */
  view?: "front" | "angled";
};

export default function Jaw3D({ selected, onToggle, onHoverChange, className, view = "front" }: Jaw3DProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    onHoverChange?.(hovered);
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, onHoverChange]);

  const cameraPosition: [number, number, number] = view === "front" ? [0, 0, 215] : [55, 40, 135];

  return (
    <div className={className}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: cameraPosition, fov: 30, near: 1, far: 1000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onPointerMissed={() => setHovered(null)}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[40, 80, 120]} intensity={1.6} />
        <directionalLight position={[-60, -20, 60]} intensity={0.45} color="#e8f6f5" />
        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 60, 80]} scale={[120, 40, 1]} />
          <Lightformer intensity={0.9} position={[-90, 0, 40]} rotation-y={Math.PI / 2} scale={[80, 80, 1]} color="#dff3f2" />
          <Lightformer intensity={0.7} position={[90, 0, 40]} rotation-y={-Math.PI / 2} scale={[80, 80, 1]} color="#fff3e0" />
        </Environment>
        <group position={[0, 0, 0]}>
          <Arch arch="upper" selected={selected} hovered={hovered} onHover={setHovered} onSelect={onToggle} />
          <Arch arch="lower" selected={selected} hovered={hovered} onHover={setHovered} onSelect={onToggle} />
        </group>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          rotateSpeed={0.55}
          minPolarAngle={Math.PI * 0.28}
          maxPolarAngle={Math.PI * 0.62}
          minAzimuthAngle={-Math.PI * 0.4}
          maxAzimuthAngle={Math.PI * 0.4}
        />
      </Canvas>
    </div>
  );
}
