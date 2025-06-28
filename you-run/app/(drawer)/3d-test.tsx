import { Asset } from 'expo-asset';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

type GLTF = {
  scene: THREE.Scene;
  scenes: THREE.Scene[];
  cameras: THREE.Camera[];
  animations: THREE.AnimationClip[];
};

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
      // 1. Asset 생성 및 다운로드
      const modelAsset = Asset.fromModule(
        require('../../assets/models/Standard_RunC_T.gltf')
      );
      const binAsset = Asset.fromModule(
        require('../../assets/models/Standard_RunC_T.bin')
      );

      await Promise.all([modelAsset.downloadAsync(), binAsset.downloadAsync()]);

      const loader = new GLTFLoader();

      // 2. resourcePath를 .gltf 파일 위치의 폴더로 지정 (bin, 텍스처 상대경로 기준)
      const resourcePath = (modelAsset.localUri || modelAsset.uri).substring(
        0,
        (modelAsset.localUri || modelAsset.uri).lastIndexOf('/') + 1
      );
      loader.setResourcePath(resourcePath);

      // 3. fetch로 .gltf 파일 직접 불러와 ArrayBuffer로 변환
      const response = await fetch(modelAsset.localUri || modelAsset.uri);
      const arrayBuffer = await response.arrayBuffer();

      // 4. parse()에 ArrayBuffer와 resourcePath 전달하여 로드
      const gltf = await new Promise<THREE.GLTF>((resolve, reject) => {
        loader.parse(arrayBuffer, resourcePath, resolve, reject);
      });

      const model = gltf.scene;
      model.scale.set(0.1, 0.1, 0.1);
      model.position.set(0, -0.5, 0);
      scene.add(model);

      // 4. 텍스처 16개 정적 배열 (필요에 따라 경로 조정)
      const textureAssets = [
        require('../../assets/models/_01.png'),
        require('../../assets/models/_02.png'),
        require('../../assets/models/_03.png'),
        require('../../assets/models/_04.png'),
        require('../../assets/models/_05.png'),
        require('../../assets/models/_06.png'),
        require('../../assets/models/_07.png'),
        require('../../assets/models/_09.png'),
        require('../../assets/models/_10.png'),
        require('../../assets/models/_11.png'),
        require('../../assets/models/_12.png'),
        require('../../assets/models/_13.png'),
        require('../../assets/models/_14.png'),
        require('../../assets/models/_15.png'),
        require('../../assets/models/_16.png'),
      ];

      // 5. 텍스처 로드
      const textures: THREE.Texture[] = [];
      for (const assetModule of textureAssets) {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        const texture = await new THREE.TextureLoader().loadAsync(
          asset.localUri || asset.uri
        );
        textures.push(texture);
      }

      // 6. 모델에 첫 번째 텍스처 수동 적용 (필요시 애니메이션이나 프레임별 교체 가능)
      model.traverse((child: THREE.Object3D) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          child.material.map = textures[0];
          child.material.needsUpdate = true;
        }
      });

      // 7. 애니메이션 실행
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
