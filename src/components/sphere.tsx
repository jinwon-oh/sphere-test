"use client";

import { HTMLAttributes, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type WindowDimentions = {
  width: number | undefined;
  height: number | undefined;
};

const useWindowDimensions = (): WindowDimentions => {
  const [windowDimensions, setWindowDimensions] = useState<WindowDimentions>({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    function handleResize(): void {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return (): void => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowDimensions;
};

interface Props extends HTMLAttributes<HTMLDivElement> {
  values: Array<Array<number>>;
  bits: number;
}

const factorial = (n: number): number => {
  if (n < 2) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
};

const combination = (n: number): number | null => {
  if (isNaN(n)) {
    alert("Factorial requires a numeric argument.");
    return null;
  }

  const i = Math.floor(n);
  const r = Math.floor(i / 2);
  return factorial(i) / (factorial(r) * factorial(n - r));
};

const SphereView = (props: Props) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { width = 300, height = 300 } = useWindowDimensions();
  const bits = props.bits;
  const values = props.values;

  const createLine = (
    pos: {
      x: number;
      y: number;
      z: number;
    },
    radius: number,
    name?: string
  ) => {
    const lineGeometry = new THREE.BufferGeometry();
    const dest = new THREE.Vector3(
      radius * pos.x,
      radius * pos.y,
      radius * pos.z
    );

    lineGeometry.setFromPoints([
      new THREE.Vector3(0, 0, 0), // Center of the sphere
      dest,
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: "tomato",
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);

    const geom = new THREE.SphereGeometry(1 / 16, 16, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: "tomato",
    });
    const dot = new THREE.Mesh(geom, mat);
    dot.position.x = dest.x;
    dot.position.y = dest.y;
    dot.position.z = dest.z;
    line.add(dot);

    line.userData.x = dest.x;
    line.userData.y = dest.y;
    line.userData.z = dest.z;
    line.userData.radius = radius;
    if (name != null) {
      line.name = name;
    }

    return line;
  };

  const createPointName = (
    lineData: {
      x: number;
      y: number;
      z: number;
      radius: number;
    },
    name: string
  ) => {
    const { x, y, z, radius } = lineData;
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(13 * (name.length + 1));
    canvas.height = 26;
    const ratio = canvas.width / canvas.height;
    const ctx = canvas.getContext("2d");

    if (ctx == null) {
      return null;
    }

    const spriteMesh = new THREE.Mesh();
    spriteMesh.position.x = x * 1.1;
    spriteMesh.position.y = y * 1.1 + (y > 0 ? 0.02 : -0.02); //radius * 0.2;
    spriteMesh.position.z = z * 1.1;

    // background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // font
    ctx.font = "24px arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
    });
    const sprite = new THREE.Sprite(spriteMat);

    // TODO: check scale values
    sprite.scale.set((ratio * radius) / 8, radius / 8, radius / 8);
    spriteMesh.add(sprite);

    return { spriteMesh, tex };
  };

  useEffect(() => {
    const segments = 32;
    const radius = 10;

    const crt = mountRef.current;
    if (crt == null || width == null || height == null) {
      return () => {};
    }

    // canvas
    const scene = new THREE.Scene();
    const size = Math.min(width, height, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(size, size);

    crt.appendChild(renderer.domElement);

    // camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.lookAt(scene.position);
    camera.position.z = radius * 1.9;
    camera.rotateZ(90);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minAzimuthAngle = Math.PI * -1;
    controls.maxAzimuthAngle = Math.PI;

    // group
    const sphereGroup = new THREE.Group();

    // // TODO: remove axes helper
    // const helper = new THREE.AxesHelper(radius * 1.5);
    // sphereGroup.add(helper);

    // sphere
    const sphereGeometry = new THREE.SphereGeometry(radius, segments, segments);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      // wireframe: true
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereGroup.add(sphere);

    // circles
    let upperGeo = new THREE.BufferGeometry().setFromPoints(
      new THREE.Path()
        .absarc(0, 0, (radius * Math.sqrt(3)) / 2, 0, Math.PI * 2)
        .getSpacedPoints(segments)
    );
    let upperMaterial = new THREE.LineBasicMaterial({ color: "aqua" });
    let upperLine = new THREE.Line(upperGeo, upperMaterial);
    upperLine.rotation.x = Math.PI / 2;
    upperLine.position.y = radius / 2;
    sphereGroup.add(upperLine);

    let lowerGeo = new THREE.BufferGeometry().setFromPoints(
      new THREE.Path()
        .absarc(0, 0, (radius * Math.sqrt(3)) / 2, 0, Math.PI * 2)
        .getSpacedPoints(segments)
    );
    let lowerMaterial = new THREE.LineBasicMaterial({ color: "aqua" });
    let lowerLine = new THREE.Line(lowerGeo, lowerMaterial);
    lowerLine.rotation.x = Math.PI / 2;
    lowerLine.position.y = (radius / 2) * -1;
    sphereGroup.add(lowerLine);

    let middleGeo = new THREE.BufferGeometry().setFromPoints(
      new THREE.Path()
        .absarc(0, 0, radius, 0, Math.PI * 2)
        .getSpacedPoints(segments)
    );
    let middleMaterial = new THREE.LineBasicMaterial({
      color: "aqua",
    });
    let middleLine = new THREE.Line(middleGeo, middleMaterial);
    middleLine.rotation.x = Math.PI / 2;
    // middleLine.rotateX(THREE.MathUtils.degToRad(90));
    sphereGroup.add(middleLine);

    const maxPoints = combination(bits);
    if (maxPoints == null) {
      return;
    }
    const maxLevel = bits;
    const map = new Map();

    const textMeshes: THREE.Texture[] = [];
    for (let index = 0; index < values.length; index++) {
      let line;
      let level = 0;
      const count = map.get(level) ?? 0;
      const value = values[index];
      value.forEach((v) => (v > 0 ? level++ : level));

      if (level === 0) {
        line = createLine({ x: 0, y: 1, z: 0 }, radius, `${value}`);
      } else if (level === maxLevel) {
        line = createLine({ x: 0, y: -1, z: 0 }, radius, `${value}`);
      } else {
        const yRad = Math.acos(1 - (level * 2) / maxLevel);
        const xzRad = (count * 2 * Math.PI) / maxPoints;
        const y = Math.cos(yRad);
        const x = Math.cos(xzRad) * Math.sin(yRad);
        const z = Math.sin(xzRad) * Math.sin(yRad);

        line = createLine({ x, y, z }, radius, `${value}`);
      }
      sphereGroup.add(line);
      const text = createPointName(
        {
          x: line.userData.x,
          y: line.userData.y,
          z: line.userData.z,
          radius: line.userData.radius,
        },
        `${value}`
      );
      if (text != null) {
        scene.add(text.spriteMesh);
        textMeshes.push(text.tex);
      }
      map.set(level, count + 1);
    }

    // Test
    // const line2 = createLine(
    //     {
    //         x: Math.cos((2 * 2 * Math.PI) / 3),
    //         y: Math.cos((2 * Math.PI) / 3),
    //         z: Math.sin((2 * 2 * Math.PI) / 3)
    //     },
    //     radius
    // );
    // sphereGroup.add(line2);
    // const spriteMesh = createPointName(
    //     {
    //         x: line2.userData.x,
    //         y: line2.userData.y,
    //         z: line2.userData.z,
    //         radius: line2.userData.radius
    //     },
    //     // "0000"
    //     "|789067890ygq90678906>"
    // );
    // if (spriteMesh != null) {
    //     scene.add(spriteMesh);
    // }

    sphereGroup.renderOrder = 100;
    scene.add(sphereGroup);

    function animate() {
      requestAnimationFrame(animate);

      // required if controls.enableDamping or controls.autoRotate are set to true
      // controls.update();

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      crt.removeChild(renderer.domElement);
      textMeshes.forEach((mesh) => mesh.dispose());
      renderer.dispose();
    };
  }, [, width, height, bits, values]);

  return <div className={props.className} ref={mountRef}></div>;
};

export default SphereView;
