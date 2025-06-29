// 러닝 기능

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MapView, { Polyline, Region, Marker } from 'react-native-maps';
import { useRunning } from '@/context/RunningContext';
import * as Location from 'expo-location';
import Running3DModel from './Running3DModel'; // 3D 모델 컴포넌트 임포트
import { savePath } from '@/storage/RunningStorage'; // ✅ 추가
import { Modal } from 'react-native';
import { TouchableOpacity } from 'react-native';

// 두 GPS 좌표 간 거리 (km) 계산
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

// 총 이동 거리 계산 (km)
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

// 평균 페이스 계산 (1km당 시간)
const calculatePace = (distanceKm: number, elapsedSeconds: number): string => {
  if (!distanceKm || !elapsedSeconds) return '0\'00"';
  const pace = elapsedSeconds / distanceKm;
  const min = Math.floor(pace / 60);
  const sec = Math.round(pace % 60);
  return `${min}'${String(sec).padStart(2, '0')}"`;
};

// 초를 MM:SS 형식으로 변환
const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function RunningScreen() {
  const [isSavedModalVisible, setIsSavedModalVisible] = useState(false);

  const [heading, setHeading] = useState(0);
  const { isActive, elapsedTime, path, startRunning, stopRunning, addToPath } =
    useRunning();
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );
  const [origin, setOrigin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | undefined>();

  const distance = useMemo(() => calculateTotalDistance(path), [path]);
  const pace = useMemo(
    () => calculatePace(distance, elapsedTime),
    [distance, elapsedTime]
  );

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
            timeInterval: 1000,
            distanceInterval: 10,
          },
          (location) => {
            addToPath(location.coords);
            if (location.coords.heading != null) {
              setHeading(location.coords.heading);
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

  // ✅ 러닝 종료 시 경로 저장 처리
  const handleStopRunning = async () => {
    stopRunning(); // 기존 멈춤 처리
    await savePath(path); // 로컬 저장
    setIsSavedModalVisible(true); // 모달 표시
  };
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
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled
        showsUserLocation
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
            />
          </Marker>
        )}
      </MapView>

      {origin && (
        <Running3DModel path={path} origin={origin} heading={heading} />
      )}

      <View style={styles.overlay}>
        <Text style={styles.distance}>{distance.toFixed(2)} km</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>{formatTime(elapsedTime)} 분:초</Text>
          <Text style={styles.stat}>{pace} 페이스</Text>
        </View>
        <Pressable
          onPress={!isActive ? startRunning : handleStopRunning} // ✅ 수정
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
      {/* ✅ 저장 완료 모달 */}
      <Modal
        transparent
        visible={isSavedModalVisible}
        animationType="fade"
        onRequestClose={() => setIsSavedModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              넌! 런! 오늘도 잘 달렸습니다! 경로가 자동으로 저장됩니다!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsSavedModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007aff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
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
