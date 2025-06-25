// import React, { Suspense } from 'react';
// import { Canvas, ThreeElements } from '@react-three/fiber/native'; 
// import { useGLTF } from '@react-three/drei/native';
// // 1. Image에서 resolveAssetSource를 가져옵니다.
// import { Image } from 'react-native';

// // 이전과 동일하게 모델을 import 합니다.
// import modelPath from '../../assets/models/MyCharacter_ExportRoot.glb';

// function Model(props: ThreeElements['group']) {
//   // 2. resolveAssetSource를 사용해 숫자 ID를 URI가 포함된 객체로 변환합니다.
//   const asset = Image.resolveAssetSource(modelPath);

//   // 3. 변환된 객체의 uri를 useGLTF에 전달합니다.
//   const { scene } = useGLTF(asset.uri) as any;

//   return <primitive object={scene} {...props} />;
// }

// export default function App() {
//   return (
//     <Canvas>
//       <Suspense fallback={null}>
//         <Model scale={0.5} />
//       </Suspense>
//       <ambientLight intensity={1} />
//       <directionalLight position={[0, 10, 5]} intensity={2} />
//     </Canvas>
//   );
// }
