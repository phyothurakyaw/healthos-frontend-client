
import React, {
  Suspense,
  useRef,
  useState,
  useEffect,
} from "react";

import { Canvas, useFrame } from "@react-three/fiber";

import {
  OrbitControls,
  useGLTF,
  Center,
} from "@react-three/drei";

// ========================================
// Imported 3D Anatomy Model
// ========================================

// Set VITE_ANATOMY_MODEL_URL=/models/licensed-human.glb
// to load your own licensed anatomy asset.
//
// The bundled procedural figure is an interactive
// stylized muscle study, not Adobe's asset.


function ImportedAnatomy({ url, autoRotate }) {
  const { scene } = useGLTF(url);
  const ref = useRef();

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;

    // Floating animation
    ref.current.position.y =
      Math.sin(clock.elapsedTime * 1.4) * 0.05;

    // Automatic 360-degree rotation
    if (autoRotate) {
      ref.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={ref}>
      <Center>
        <primitive
          object={scene}
          scale={Number(
            import.meta.env.VITE_HUMAN_MODEL_SCALE || 1
          )}
        />
      </Center>
    </group>
  );
}


// ========================================
// Individual Muscle Component
// ========================================

function Muscle({
  position,
  scale,
  color,
  onClick,
  rotation = [0, 0, 0],
}) {
  return (
    <mesh
      position={position}
      scale={scale}
      rotation={rotation}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <sphereGeometry args={[1, 28, 20]} />

      <meshPhysicalMaterial
        color={color}
        roughness={0.46}
        metalness={0.1}
        clearcoat={0.28}
      />
    </mesh>
  );
}

// ========================================
// Procedural Anatomical Figure
// ========================================

function AnatomicalFigure({
  readiness,
  selected,
  onSelect,
  autoRotate,
}) {
  const ref = useRef();

  useFrame(({ clock }, delta) => {
    if (ref.current) {
      if (autoRotate) {
        ref.current.rotation.y += delta * 0.17;
      }

      ref.current.position.y =
        Math.sin(clock.elapsedTime * 1.5) * 0.018;
    }
  });

  const base = "#b65b63";
  const light = "#e18486";

  const highlight =
    readiness >= 70
      ? "#6ef3d1"
      : readiness >= 40
        ? "#f8c46d"
        : "#ff868d";

  const muscle = (name, position, scale, rotation) => (
    <Muscle
      key={name}
      position={position}
      scale={scale}
      rotation={rotation}
      color={selected === name ? highlight : base}
      onClick={() => onSelect(name)}
    />
  );

  return (
    <group ref={ref} position={[0, -0.1, 0]}>
      {/* Head */}
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.245, 32, 24]} />

        <meshStandardMaterial
          color="#c88b82"
          roughness={0.7}
        />
      </mesh>

      {/* Neck */}
      <mesh
        position={[0, 1.28, 0]}
        scale={[0.115, 0.17, 0.12]}
      >
        <sphereGeometry args={[1, 24, 20]} />

        <meshStandardMaterial color="#bb7d76" />
      </mesh>

      {/* Core */}
      {muscle(
        "core",
        [0, 0.43, 0],
        [0.38, 0.62, 0.24]
      )}

      {/* Left and Right Body Parts */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Chest */}
          {muscle(
            "chest",
            [side * 0.2, 0.93, 0.19],
            [0.24, 0.23, 0.16],
            [0, 0, side * 0.15]
          )}

          {/* Shoulders */}
          {muscle(
            "shoulders",
            [side * 0.47, 0.99, 0.02],
            [0.19, 0.23, 0.23]
          )}

          {/* Upper Arms */}
          {muscle(
            "arms",
            [side * 0.55, 0.52, 0.02],
            [0.13, 0.37, 0.14],
            [0, 0, side * 0.11]
          )}

          {/* Forearms */}
          {muscle(
            "arms",
            [side * 0.61, 0.04, 0.02],
            [0.105, 0.35, 0.12],
            [0, 0, -side * 0.08]
          )}

          {/* Thighs */}
          {muscle(
            "legs",
            [side * 0.21, -0.37, 0],
            [0.22, 0.48, 0.22],
            [0, 0, -side * 0.03]
          )}

          {/* Lower Legs */}
          {muscle(
            "legs",
            [side * 0.22, -1.12, -0.03],
            [0.145, 0.39, 0.15]
          )}

          {/* Feet */}
          <mesh
            position={[side * 0.22, -1.52, 0.09]}
            scale={[0.15, 0.1, 0.28]}
          >
            <sphereGeometry args={[1, 20, 16]} />

            <meshStandardMaterial color="#a96e70" />
          </mesh>
        </group>
      ))}

      {/* Abdominal Muscles */}
      {Array.from({ length: 6 }, (_, index) =>
        muscle(
          "core",
          [
            index % 2 === 0 ? -0.12 : 0.12,
            0.71 - Math.floor(index / 2) * 0.19,
            0.205,
          ],
          [0.115, 0.086, 0.065]
        )
      )}

      {/* Highlight Lighting */}
      <pointLight
        position={[0, 0.45, 0.9]}
        intensity={1.6}
        color={highlight}
        distance={3.5}
      />
    </group>
  );
}

// ========================================
// Main Human Component
// ========================================

export default function Human({
  readiness = 70,
  expanded = false,
}) {
  const [selected, setSelected] = useState("core");
  const [autoRotate, setAutoRotate] = useState(true);
  const [error, setError] = useState(false);

  const modelUrl =
    import.meta.env.VITE_ANATOMY_MODEL_URL ||
    "/models/human.glb";

  const [modelAvailable, setModelAvailable] =
    useState(false);

  // ========================================
  // Check Model Availability
  // ========================================

  useEffect(() => {
    let active = true;

    fetch(modelUrl, {
      method: "HEAD",
    })
      .then((response) => {
        if (active) {
          setModelAvailable(
            response.ok &&
              /model\/gltf-binary|application\/octet-stream/i.test(
                response.headers.get("content-type") || ""
              )
          );
        }
      })
      .catch(() => {
        if (active) {
          setModelAvailable(false);
        }
      });

    return () => {
      active = false;
    };
  }, [modelUrl]);

  // ========================================
  // Muscle Descriptions
  // ========================================

  const descriptions = {
    core: "Core and abdominal stability",
    chest: "Chest and upper-body pushing",
    shoulders: "Shoulder mobility and strength",
    arms: "Arm strength and endurance",
    legs: "Lower-body strength and movement",
  };

  // ========================================
  // Render 3D Human Viewer
  // ========================================

  return (
    <div className="w-full">
      <div
        className={
          expanded
            ? "body-stage body-stage-large"
            : "body-stage"
        }
      >
        {error ? (
          <div className="human-fallback">
            <p>
              3D is unavailable. Try a WebGL-capable
              browser.
            </p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="p-8 muted">
                Loading body explorer…
              </div>
            }
          >
            <Canvas
              camera={{
                position: [0, 0.05, 4.3],
                fov: 43,
              }}
              dpr={[1, 1.7]}
              onCreated={({ gl }) =>
                gl.domElement.addEventListener(
                  "webglcontextlost",
                  () => setError(true),
                  { once: true }
                )
              }
            >
              {/* Background */}
              <color
                attach="background"
                args={["#091a29"]}
              />

              {/* Lighting */}
              <ambientLight intensity={1.7} />

              <directionalLight
                position={[3, 5, 4]}
                intensity={2.5}
              />

              <directionalLight
                position={[-4, 2, -2]}
                color="#48c4e4"
                intensity={1.4}
              />

              {/* Floor Grid */}
              <gridHelper
                args={[
                  6,
                  12,
                  "#245063",
                  "#132d42",
                ]}
                position={[0, -1.8, 0]}
              />

              {/* 3D Human */}
              {modelAvailable ? (
                <ImportedAnatomy
                    url={modelUrl}
                    autoRotate={autoRotate}
                />
                ) : (
                <AnatomicalFigure
                  readiness={readiness}
                  selected={selected}
                  onSelect={setSelected}
                  autoRotate={autoRotate}
                />
              )}

              {/* Mouse Controls */}
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={2.6}
                maxDistance={7}
                target={[0, 0, 0]}
              />
            </Canvas>
          </Suspense>
        )}

        {/* 3D Viewer Overlay */}
        <div className="body-overlay">
          {/* <span className="pill">
            ● Interactive anatomy
          </span> */}

          <span className="muted text-xs">
            Drag · Rotate · Zoom
          </span>
        </div>
      </div>

      {/* ====================================
          Body Information and Controls
      ==================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div>
          {/* <strong className="capitalize">
            {modelAvailable
              ? "Realistic 3D human model"
              : selected}
          </strong>

          <p className="muted text-xs">
            {modelAvailable
              ? "Real 3D mesh loaded from your licensed GLB"
              : descriptions[selected]}
          </p> */}
        </div>

        {/* Auto Rotation Button */}
        <button
          type="button"
          className="ghost text-sm"
          onClick={() =>
            setAutoRotate((value) => !value)
          }
        >
          {autoRotate
            ? "Pause rotation"
            : "Auto rotate"}
        </button>
      </div>

      {/* Model Information */}
      {/* {!modelAvailable && (
        <p className="muted text-xs mt-3">
          To show a realistic human rather than
          the illustrated fallback, add a properly
          licensed human GLB at{" "}
          <code>
            healthos-frontend/public/models/human.glb
          </code>
          . The Adobe Stock video cannot be
          converted into an interactive model
          automatically.
        </p>
      )} */}
    </div>
  );
}
