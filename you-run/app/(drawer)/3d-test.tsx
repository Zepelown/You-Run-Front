import { Asset } from 'expo-asset';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function App() {
  const timeoutRef = useRef<number | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.z = 1;

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    try {
      // glb 파일을 프로젝트 내 assets/models 폴더에 위치시켜야 함
      const modelAsset = Asset.fromModule(
        require('../../assets/models/Test_RunC.glb')
      );

      await modelAsset.downloadAsync();

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(
        modelAsset.localUri || modelAsset.uri
      );

      const model = gltf.scene;
      model.scale.set(0.1, 0.1, 0.1);
      model.position.set(0, -0.5, 0);
      scene.add(model);

      if (gltf.animations.length > 0) {
        mixerRef.current = new THREE.AnimationMixer(model);
        const action = mixerRef.current.clipAction(gltf.animations[0]);
        action.play();
      }
    } catch (err) {
      console.error('❌ 모델 로딩 중 오류:', err);
    }

    const clock = new THREE.Clock();

    const animate = () => {
      timeoutRef.current = requestAnimationFrame(animate);
      mixerRef.current?.update(clock.getDelta());
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) cancelAnimationFrame(timeoutRef.current);
      mixerRef.current?.stopAllAction();
    };
  }, []);

  return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
}
