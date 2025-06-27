import { useRunning } from '@/context/RunningContext';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline, Region } from 'react-native-maps';

// ==================================================================
// 헬퍼 함수 (계산 로직)
// ==================================================================

/** 하버사인 공식으로 두 좌표 간 직선 거리를 km 단위로 계산 */
const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371; // 지구 반경 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** GPS 좌표 배열로부터 총 이동 거리를 누적 계산 */
const calculateTotalDistance = (path: { latitude: number; longitude: number }[]): number => {
  if (path.length < 2) return 0;
  return path.slice(1).reduce((sum, curr, i) => {
    const prev = path[i];
    return sum + haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }, 0);
};

/** 총 이동 거리(km)와 경과 시간(초)를 받아 페이스(분'초")를 계산 */
const calculatePace = (distanceKm: number, elapsedSeconds: number): string => {
  if (distanceKm === 0 || elapsedSeconds === 0) return `0'00"`;
  const secPerKm = elapsedSeconds / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${String(s).padStart(2, '0')}"`;
};

/** 초를 mm:ss 형식 문자열로 변환 */
const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ==================================================================
// RunningScreen 컴포넌트
// ==================================================================

export default function RunningScreen() {
  const router = useRouter();
  const {
    isActive,
    elapsedTime,
    path,
    currentSpeed,
    totalDistance,
    movingTime,
    startRunning,
    stopRunning,
    resumeRunning,  
    resetRunning,
  } = useRunning();

  const displaySpeed = currentSpeed > 0.1 ? currentSpeed : 0;
  const instantPace = displaySpeed > 0 ? calculatePace(1,3600 / displaySpeed) : `0'00"` 
  // 지도를 중앙에 맞출 때 쓸 region 상태
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);

  // “일시정지” 상태 관리
  const [isPaused, setIsPaused] = useState(false);

  // —–– 마운트 시 위치 권한 요청 & 초기Region 설정
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // —–– path가 바뀔 때마다 지도를 최신 좌표로 이동
  useEffect(() => {
    if (path.length > 0) {
      const last = path[path.length - 1];
      setMapRegion({
        latitude: last.latitude,
        longitude: last.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, [path]);

 /** 메인 버튼(시작/정지/재개) 눌렀을 때 */
  const onMainPress = () => {
    if (isActive) {
      // 달리는 중 → 일시정지
      stopRunning();
      setIsPaused(true);
    } else if (isPaused) {
      // 일시정지 중 → 재개
      resumeRunning();
      setIsPaused(false);
    } else {
      // 처음 (또는 완전 종료 후) → 새로 시작
      startRunning();
      setIsPaused(false);
    }
  }


  /** “종료” 클릭 → 요약 화면으로 이동 (path, 거리, 시간 전달) */
  const handleFinish = () => {
    // 1) 달리기 멈추기
    stopRunning();
    // 2) 전달할 데이터 스냅샷
    const snapshot = { path, totalDistance, elapsedTime, movingTime };
    // 3) 컨텍스트 완전 초기화
    resetRunning();
    // 4) replace 네비게이션 (push가 아니라 replace!)
    router.replace({
        pathname: '/summary',
        params: { data: JSON.stringify(snapshot) },
    });
  };

    // 버튼에 들어갈 텍스트 결정
    const mainLabel = isActive ? '정지': isPaused  ? '재개'  : '시작';



//   // 페이스 = 누적거리(totalDistance) + 누적시간(elapsedTime) 기준
//   const pace = useMemo(
//     () => calculatePace(totalDistance, elapsedTime),
//     [totalDistance, elapsedTime]
//   );

  return (
    <View style={styles.container}>
      {/* 지도가 화면 전체 */}
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.9780,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        {...(mapRegion && { region: mapRegion })}
        showsUserLocation
        followsUserLocation
        showsMyLocationButton
      >
        <Polyline coordinates={path} strokeColor="#007aff" strokeWidth={6} />
      </MapView>

      {/* 오버레이 정보 패널 */}
      <View style={styles.overlay}>
        {/* 누적 거리 */}
        <Text style={styles.distance}>{totalDistance.toFixed(2)} km</Text>
        {/* 현재 속도 / 경과 시간 / 페이스 */}
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>{displaySpeed.toFixed(1)} km/h</Text>
          <Text style={styles.stat}>{formatTime(elapsedTime)} 시간</Text>
          <Text style={styles.stat}>{instantPace} 페이스</Text>
        </View>

        {/* 버튼 행: 시작↔정지, (일시정지 후) 종료 */}
        <View style={styles.buttonRow}>
          <Pressable
              onPress={onMainPress}
            style={[
              styles.controlButton,
              { backgroundColor: isActive ? '#ff4d4d' : '#007aff' },
            ]}
            >
            <Text style={styles.controlText}>{mainLabel}</Text>
          </Pressable>

          {/* 한 번이라도 실행 후 멈춘 상태일 때만 노출 */}
          {(isPaused || (!isActive && elapsedTime > 0)) && (
            <Pressable
              onPress={handleFinish}
              style={[styles.controlButton, { backgroundColor: '#333' }]}
            >
              <Text style={styles.controlText}>종료</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

// ==================================================================
// 스타일
// ==================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  distance: {
    fontSize: 60,
    fontWeight: '800',
    color: '#1c1c1e',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
    marginBottom: 20,
  },
  stat: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  controlText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
