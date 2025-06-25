import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import SphereMarker from './SphereMarker'; // expo-three로 만든 3D 구체 컴포넌트 import

// Marker를 애니메이션 가능하도록 React Native의 Animated로 감싸줍니다.
const AnimatedMarker = Animated.createAnimatedComponent(Marker);

// 서버에서 받아올 GPS 좌표 배열 예시
const path = [
  { latitude: 37.5665, longitude: 126.9780 }, // 서울 시청
  { latitude: 37.5651, longitude: 126.9895 }, // 을지로3가역
  { latitude: 37.5700, longitude: 126.9910 }, // 종로3가역
];

export default function MapScreen() {
  // 1. 위도와 경도를 위한 별도의 Animated.Value를 생성합니다.
  // 이 방법은 AnimatedRegion보다 타입스크립트와의 호환성이 좋습니다.
  const latitudeAnim = useRef(new Animated.Value(path[0].latitude)).current;
  const longitudeAnim = useRef(new Animated.Value(path[0].longitude)).current;

  // 컴포넌트가 처음 렌더링될 때 애니메이션을 시작합니다.
  useEffect(() => {
    let idx = 1;
    const interval = setInterval(() => {
      // 경로의 끝에 도달하면 인터벌을 멈춥니다.
      if (idx >= path.length) {
        clearInterval(interval);
        return;
      }

      // 2. Animated.parallel을 사용해 위도와 경도를 동시에 애니메이션 처리합니다.
      // 이렇게 하면 대각선으로 부드럽게 이동합니다.
      Animated.parallel([
        Animated.timing(latitudeAnim, {
          toValue: path[idx].latitude,
          duration: 1500, // 이동 시간 (ms)
          useNativeDriver: false, // 지도 좌표 관련 애니메이션에는 false가 안정적입니다.
        }),
        Animated.timing(longitudeAnim, {
          toValue: path[idx].longitude,
          duration: 1500, // 이동 시간 (ms)
          useNativeDriver: false,
        }),
      ]).start();
      
      idx += 1;
    }, 2000); // 2초 간격으로 다음 지점으로 이동 시작

    // 컴포넌트가 화면에서 사라질 때 인터벌을 정리하여 메모리 누수를 방지합니다.
    return () => clearInterval(interval);
  }, []);

  return (
    <MapView
      style={styles.map}
      // 지도의 초기 위치와 확대 수준을 설정합니다.
      initialRegion={{
        latitude: path[0].latitude,
        longitude: path[0].longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
    >
      {/* 경로를 파란색 선으로 그립니다. */}
      <Polyline 
        coordinates={path} 
        strokeColor="#1E90FF" 
        strokeWidth={5} 
      />
      
      {/* 3. 애니메이션이 적용된 마커 */}
      <AnimatedMarker
        // coordinate prop에 애니메이션 값들을 객체 형태로 전달합니다.
        coordinate={{
          latitude: latitudeAnim,
          longitude: longitudeAnim,
        }}
        // 중요: 마커의 크기를 지정해야 내부 3D 뷰가 렌더링될 공간이 생깁니다.
        // 이 크기가 곧 3D 구체의 크기가 됩니다.
        style={{ width: 80, height: 80 }} 
      >
        {/* 마커의 자식으로 3D 구체 컴포넌트를 렌더링합니다. */}
        <SphereMarker />
      </AnimatedMarker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
