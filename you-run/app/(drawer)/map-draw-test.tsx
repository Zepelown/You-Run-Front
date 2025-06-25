// import React, { useRef, useEffect } from 'react';
// import { Animated, StyleSheet, View } from 'react-native'; // View 추가
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import SphereMarker from ''; // 방금 만든 SphereMarker 컴포넌트를 import 합니다.

// const AnimatedMarker = Animated.createAnimatedComponent(Marker);
// const path = [/* ... */]; // 경로는 그대로 사용

// export default function MapScreen() {
//   const latitudeAnim = useRef(new Animated.Value(path[0].latitude)).current;
//   const longitudeAnim = useRef(new Animated.Value(path[0].longitude)).current;

//   // useEffect 로직은 이전과 동일합니다.
//   useEffect(() => {
//     // ...
//   }, []);

//   return (
//     <MapView
//       style={styles.map}
//       initialRegion={{
//         latitude: path[0].latitude,
//         longitude: path[0].longitude,
//         latitudeDelta: 0.02,
//         longitudeDelta: 0.02,
//       }}
//     >
//       <Polyline 
//         coordinates={path} 
//         strokeColor="#1E90FF" 
//         strokeWidth={5} 
//       />
      
//       <AnimatedMarker
//         coordinate={{
//           latitude: latitudeAnim,
//           longitude: longitudeAnim,
//         }}
//         // 중요: 마커의 크기를 지정해야 내부의 3D 뷰가 렌더링될 공간이 생깁니다.
//         style={{ width: 60, height: 60 }} 
//       >
//         {/* 마커의 자식으로 3D 구체 컴포넌트를 렌더링합니다. */}
//         <SphereMarker />
//       </AnimatedMarker>
//     </MapView>
//   );
// }

// const styles = StyleSheet.create({
//   map: {
//     flex: 1,
//   },
// });
