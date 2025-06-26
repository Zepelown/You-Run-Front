import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MapView, { Polyline, Region, Marker } from 'react-native-maps';
import { GLView } from 'expo-gl';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { Renderer } from 'expo-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useRunning } from '@/context/RunningContext';
import * as Location from 'expo-location';

// ===================================================================
// 헬퍼 함수들
// ===================================================================

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateTotalDistance = (
  path: { latitude: number; longitude: number }[]
) => {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineDistance(
      path[i - 1].latitude,
      path[i - 1].longitude,
      path[i].latitude,
      path[i].longitude
    );
  }
  return total;
};

const calculatePace = (distanceKm: number, elapsedSeconds: number): string => {
  if (!distanceKm || !elapsedSeconds) return '0\'00"';
  const pace = elapsedSeconds / distanceKm;
  const min = Math.floor(pace / 60);
  const sec = Math.round(pace % 60);
  return `${min}'${String(sec).padStart(2, '0')}"`;
};

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const convertLatLngToLocal = (
  lat: number,
  lng: number,
  originLat: number,
  originLng: number
): { x: number; z: number } => {
  const dx = haversineDistance(originLat, originLng, originLat, lng);
  const dz = haversineDistance(originLat, originLng, lat, originLng);
  return {
    x: (lng < originLng ? -dx : dx) * 1000,
    z: (lat < originLat ? -dz : dz) * 1000,
  };
};

const calculateRotationAngle = (
  prev: { x: number; z: number },
  curr: { x: number; z: number }
) => {
  return Math.atan2(curr.x - prev.x, curr.z - prev.z);
};

// ===================================================================
// 메인 컴포넌트
// ===================================================================

export default function RunningScreen() {
  const [heading, setHeading] = useState(0); // 🔥 여기에 추가
  const { isActive, elapsedTime, path, startRunning, stopRunning, addToPath } =
    useRunning();
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );
  const [origin, setOrigin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null); // ✅ 변경됨
  const [mapRegion, setMapRegion] = useState<Region | undefined>();
  const modelRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const requestRef = useRef<number | null>(null);

  const distance = useMemo(() => calculateTotalDistance(path), [path]);
  const pace = useMemo(
    () => calculatePace(distance, elapsedTime),
    [distance, elapsedTime]
  );

  // ✅ 현재 위치 받아와 origin 설정
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('위치 권한이 거부되었습니다.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setOrigin({ latitude, longitude });
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  // path가 바뀔 때마다 지도 중심 이동 (기존 코드)
  useEffect(() => {
    if (path.length > 0) {
      const latest = path[path.length - 1];
      setMapRegion({
        latitude: latest.latitude,
        longitude: latest.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, [path]);

  // ✅ isActive 변화에 따라 위치 실시간 추적 시작/종료
  useEffect(() => {
    if (isActive) {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('위치 권한이 거부되었습니다.');
          return;
        }

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000, // 1초마다 위치 업데이트
            distanceInterval: 10, // 1미터 이상 이동 시
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            addToPath(location.coords); // 경로에 좌표 추가
            if (location.coords.heading != null) {
              setHeading(location.coords.heading); // ✅ 여기서 heading 저장
            }
          }
        );
      })();
    } else {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    }

    return () => {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
  }, [isActive]);

  const onContextCreate = async (gl: any) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 3);

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    scene.add(new THREE.AmbientLight(0xffffff));

    const modelAsset = Asset.fromModule(
      require('../../assets/models/Standard_RunC.glb')
    );
    await modelAsset.downloadAsync();
    const loader = new GLTFLoader();

    const resourcePath = modelAsset.localUri
      ? modelAsset.localUri.replace('Standard_RunC.glb', '')
      : modelAsset.uri.replace('Standard_RunC.glb', '');

    loader.setResourcePath(resourcePath);

    const gltf = await loader.loadAsync(modelAsset.localUri || modelAsset.uri);
    const model = gltf.scene;
    model.scale.set(1, 1, 1); // 10배 확대
    scene.add(model);
    modelRef.current = model;

    if (gltf.animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(model);
      const action = mixerRef.current.clipAction(gltf.animations[0]);
      action.play();
    }

    const clock = new THREE.Clock();

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      mixerRef.current?.update(clock.getDelta());

      if (modelRef.current && origin) {
        let curr = { x: 0, z: 0 };

        if (path.length >= 1) {
          const prev = convertLatLngToLocal(
            path[path.length - 1].latitude,
            path[path.length - 1].longitude,
            origin.latitude,
            origin.longitude
          );
          curr = convertLatLngToLocal(
            path[path.length - 1].latitude,
            path[path.length - 1].longitude,
            origin.latitude,
            origin.longitude
          );
          modelRef.current.rotation.y = calculateRotationAngle(prev, curr);
        } else if (path.length === 1) {
          curr = convertLatLngToLocal(
            path[0].latitude,
            path[0].longitude,
            origin.latitude,
            origin.longitude
          );
        }

        modelRef.current.position.set(curr.x, 0, curr.z);

        // 👉 heading 값 사용해서 모델 회전
        modelRef.current.rotation.y = (-heading * Math.PI) / 180;

        // ✅ 카메라도 회전하고 싶으면 함께 처리
        camera.position.set(curr.x, 5, curr.z + 10);
        camera.lookAt(curr.x, 0, curr.z);
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      mixerRef.current?.stopAllAction();
    };
  }, []);

  // ✅ origin이 아직 없으면 로딩 화면
  if (!origin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>위치를 가져오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={mapRegion}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        showsUserLocation={true}
      >
        <Polyline coordinates={path} strokeColor="#007aff" strokeWidth={5} />

        {path.length > 0 && (
          <Marker
            coordinate={path[path.length - 1]}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 20,
                borderRightWidth: 20,
                borderBottomWidth: 30,
                borderStyle: 'solid',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: 'rgba(0, 122, 255, 0.6)',
                transform: [{ rotate: `${heading * (Math.PI / 180)}rad` }],
              }}
            ></View>
          </Marker>
        )}
      </MapView>

      {origin && (
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={onContextCreate}
        />
      )}

      <View style={styles.overlay}>
        <Text style={styles.distance}>{distance.toFixed(2)} km</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>{formatTime(elapsedTime)} 분:초</Text>
          <Text style={styles.stat}>{pace} 페이스</Text>
        </View>
        <Pressable
          onPress={!isActive ? startRunning : stopRunning}
          style={({ pressed }) => [
            styles.runButton,
            { backgroundColor: isActive ? '#ff4d4d' : '#007aff' },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.runButtonText}>
            {!isActive ? '시작' : '정지'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ===================================================================
// 스타일
// ===================================================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  distance: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  stat: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  runButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  runButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
