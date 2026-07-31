"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { colorsThree } from "@/lib/tokens";

/**
 * TelemetryScene — the hero's signature visual.
 *
 * A perspective grid horizon with glowing concentric sector arcs and
 * orbiting data nodes that trace paths along them, standing in for
 * live car positions. Deliberately not a literal 3D car model — the
 * abstraction reads as "live system" rather than "render of an object."
 *
 * Self-contained: mounts its own renderer into a ref'd container and
 * tears everything down on unmount, so it's safe to use inside Next's
 * client-side tree without leaking WebGL contexts on navigation.
 */
export function TelemetryScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { cyan, red, void: voidColor, particle } = colorsThree;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(voidColor, 0.045);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 3.2, 9);
    camera.lookAt(0, 0, -8);

    // --- perspective grid plane ---
    const gridGroup = new THREE.Group();
    const gridSize = 60;
    const gridDiv = 40;
    const gridGeo = new THREE.BufferGeometry();
    const gridPos: number[] = [];
    for (let i = 0; i <= gridDiv; i++) {
      const t = (i / gridDiv - 0.5) * gridSize;
      gridPos.push(t, 0, -gridSize, t, 0, gridSize * 0.3);
      gridPos.push(
        -gridSize * 0.5,
        0,
        t * 0.5 - gridSize * 0.1,
        gridSize * 0.5,
        0,
        t * 0.5 - gridSize * 0.1
      );
    }
    gridGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(gridPos, 3)
    );
    const gridMat = new THREE.LineBasicMaterial({
      color: cyan,
      transparent: true,
      opacity: 0.08,
    });
    const gridLines = new THREE.LineSegments(gridGeo, gridMat);
    gridLines.position.y = -1.6;
    gridGroup.add(gridLines);
    scene.add(gridGroup);

    // --- glowing concentric sector arcs ---
    const arcs: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const radius = 3 + i * 2.2;
      const arcGeo = new THREE.TorusGeometry(radius, 0.006, 8, 100, Math.PI * 1.3);
      const arcMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? cyan : red,
        transparent: true,
        opacity: 0.18 - i * 0.02,
      });
      const arc = new THREE.Mesh(arcGeo, arcMat);
      arc.rotation.x = Math.PI / 2 - 0.42;
      arc.position.set(0, -1.55, -8);
      arc.userData.speed = 0.04 + i * 0.012;
      arc.userData.dir = i % 2 === 0 ? 1 : -1;
      scene.add(arc);
      arcs.push(arc);
    }

    // --- orbiting data nodes (live "car position" markers) ---
    type NodeData = {
      radius: number;
      speed: number;
      offset: number;
      dir: number;
    };
    const nodes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.05, 12, 12);
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? red : cyan,
      });
      const node = new THREE.Mesh(nodeGeo, mat);
      const glow = new THREE.PointLight(i % 3 === 0 ? red : cyan, 1.2, 4);
      node.add(glow);
      const data: NodeData = {
        radius: 3 + (i % 4) * 2.2,
        speed: 0.15 + Math.random() * 0.25,
        offset: Math.random() * Math.PI * 2,
        dir: i % 2 === 0 ? 1 : -1,
      };
      node.userData = data;
      scene.add(node);
      nodes.push(node);
    }

    // --- ambient particle field ---
    const particleCount = 800;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 40;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: particle,
      size: 0.025,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // --- lighting ---
    scene.add(new THREE.AmbientLight(0x223344, 0.6));
    const key = new THREE.PointLight(cyan, 0.8, 30);
    key.position.set(0, 4, -2);
    scene.add(key);

    // --- mouse parallax ---
    let targetRX = 0;
    let targetRY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      targetRX = (e.clientY / window.innerHeight - 0.5) * 0.06;
      targetRY = (e.clientX / window.innerWidth - 0.5) * 0.1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const clock = new THREE.Clock();
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      arcs.forEach((arc) => {
        arc.rotation.z += arc.userData.speed * 0.01 * arc.userData.dir;
      });

      nodes.forEach((node) => {
        const data = node.userData as NodeData;
        const a = t * data.speed * data.dir + data.offset;
        node.position.set(
          Math.cos(a) * data.radius * 0.65,
          -1.55 + Math.sin(t * 2 + data.offset) * 0.04,
          -8 + Math.sin(a) * data.radius * 0.42
        );
      });

      particles.rotation.y = t * 0.008;
      gridLines.position.z = (t * 1.6) % ((gridSize / gridDiv) * 2);

      camera.position.x += (targetRY * 2 - camera.position.x) * 0.02;
      camera.position.y += (3.2 - targetRX * 4 - camera.position.y) * 0.02;
      camera.lookAt(0, -0.4, -8);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      nodeGeo.dispose();
      arcs.forEach((arc) => {
        arc.geometry.dispose();
        (arc.material as THREE.Material).dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 z-0"
    />
  );
}
