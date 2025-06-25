import { GLView } from 'expo-gl';
import * as ExpoTHREE from 'expo-three';
import React, { useEffect } from 'react';
import * as THREE from 'three';

export default function SphereMarker() {
  let timeout: number;

  useEffect(() => {
    // 컴포넌트가 사라질 때 애니메이션 프레임을 정리합니다.
    return () => cancelAnimationFrame(timeout);
  }, []);

  const onContextCreate = async (gl: any) => {
    // 1. 장면, 카메라, 렌더러 설정
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    // 중요: gl 객체에 alpha: true를 전달해야 배경이 투명해집니다.
    const renderer = new ExpoTHREE.Renderer({ gl, alpha: true }); 
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // 2. 3D 객체를 큐브에서 '구체(Sphere)'로 변경
    const geometry = new THREE.SphereGeometry(1, 32, 32); // 반지름 1, 세그먼트 32x32
    
    // 3. 재질을 좀 더 입체적으로 보이게 수정 (빛의 영향을 받도록)
    const material = new THREE.MeshStandardMaterial({
      color: 'royalblue', // 구체의 색상
      roughness: 0.5,     // 표면의 거칠기
      metalness: 0.5,     // 금속성
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 4. 빛 추가 (MeshStandardMaterial은 빛이 없으면 검게 보입니다)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 전역 조명
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1); // 특정 지점 조명
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 2.5; // 구체가 화면에 꽉 차도록 카메라를 조금 당깁니다.

    const animate = () => {
      timeout = requestAnimationFrame(animate);
      
      sphere.rotation.y += 0.01; // y축으로만 회전시켜 봅니다.
      
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };

  return (
    <GLView
      style={{ flex: 1 }}
      onContextCreate={onContextCreate}
    />
  );
}
