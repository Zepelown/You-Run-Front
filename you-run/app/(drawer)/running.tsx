import { useRunning } from '@/context/RunningContext';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react'; // 💥 useMemo를 import 합니다.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline, Region } from 'react-native-maps';

// ==================================================================
// 헬퍼 함수 (계산 로직)
// ==================================================================

/**
 * 두 지점의 위도, 경도 좌표를 받아 거리를 km 단위로 계산합니다 (하버사인 공식).
 */
const haversineDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number => {
    const R = 6371; // 지구의 반경 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * GPS 좌표 배열(path)을 받아 총 이동 거리를 계산합니다.
 */
const calculateTotalDistance = (path: { latitude: number; longitude: number }[]): number => {
    if (path.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
        const prevCoord = path[i - 1];
        const currentCoord = path[i];
        totalDistance += haversineDistance(
            prevCoord.latitude, prevCoord.longitude,
            currentCoord.latitude, currentCoord.longitude
        );
    }
    return totalDistance;
};

/**
 * 총 이동 거리(km)와 경과 시간(초)을 받아 페이스를 '분'초"' 형식으로 계산합니다.
 */
const calculatePace = (distanceKm: number, elapsedSeconds: number): string => {
    if (distanceKm === 0 || elapsedSeconds === 0) {
        return "0'00\"";
    }
    const paceSecondsPerKm = elapsedSeconds / distanceKm;
    const minutes = Math.floor(paceSecondsPerKm / 60);
    const seconds = Math.round(paceSecondsPerKm % 60);
    return `${minutes}'${String(seconds).padStart(2, '0')}"`;
};


// 초를 '분:초' 형식으로 변환하는 헬퍼 함수
const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// ==================================================================
// 메인 컴포넌트
// ==================================================================

export default function RunningScreen() {
    const { isActive, elapsedTime, path,currentSpeed, totalDistance, startRunning, stopRunning } = useRunning();
    const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);

  // —–– 처음 마운트 시 위치 권한 요청 & 초기 위치 설정
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

    useEffect(() => {
        if (path.length > 0) {
            const latestCoordinate = path[path.length - 1];
            setMapRegion({
                latitude: latestCoordinate.latitude,
                longitude: latestCoordinate.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }
    }, [path]);

    // 거리, 페이스, 속도 계산 (useMemo로 최적화)
  const distance = useMemo(() => calculateTotalDistance(path), [path]);
  const pace     = useMemo(() => calculatePace(distance, elapsedTime), [distance, elapsedTime]);

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFill}
                initialRegion={{
                    latitude: 37.5665,
                    longitude: 126.9780,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                // mapRegion이 undefined가 아닐 때만 region prop으로 넘김
                {...(mapRegion && { region: mapRegion })}
                // 내 위치 파란 점 표시
                showsUserLocation={true}
                // 내 위치 업데이트 시 지도가 따라오도록
                followsUserLocation={true}
                // 내 위치 버튼(안드로이드) 노출
                showsMyLocationButton={true}
                >
                
                <Polyline
                    coordinates={path}
                    strokeColor="#007aff"
                    strokeWidth={6}
                />
            </MapView>

            <View style={styles.overlay}>
                {/* 💥 계산된 distance 변수를 사용합니다. */}
                <Text style={styles.distance}>{totalDistance.toFixed(2)} km</Text>
                <View style={styles.statsContainer}>
                    {/* 1) 현재 속도 */}
                    <Text style={styles.stat}>{currentSpeed.toFixed(1)} km/h</Text>
                    {/* 2) 경과 시간 */}
                    <Text style={styles.stat}>{formatTime(elapsedTime)} 시간</Text>
                    {/* 3) 페이스 */}
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
                    <Text style={styles.runButtonText}>{!isActive ? '시작' : '정지'}</Text>
                </Pressable>
            </View>
        </View>
    );
}


// ... styles는 이전과 동일합니다.
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    overlay: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    runButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    runButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
