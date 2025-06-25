import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function GpsScreen() {
  // 1. 상태 변수 선언
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2. useEffect를 사용한 권한 요청 및 위치 추적
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    // 비동기 함수를 선언하고 바로 호출
    (async () => {
      // 권한 요청
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('위치 정보 접근 권한이 거부되었습니다.');
        return;
      }

      // 위치 추적 시작
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // 가장 높은 정확도
          timeInterval: 1000, // 1초마다 업데이트
          distanceInterval: 1, // 1미터 이동 시 업데이트
        },
        (newLocation) => {
          setLocation(newLocation); // 위치 정보가 업데이트될 때마다 state 업데이트
        }
      );
    })();

    // 3. Cleanup 함수: 화면을 벗어날 때 위치 추적 중지
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []); // 컴포넌트가 마운트될 때 한 번만 실행

  // 4. 화면에 표시할 내용 결정
  let text = '위치 정보를 기다리는 중...';
  if (errorMsg) {
    text = errorMsg;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GPS 실시간 정보</Text>
      {location ? (
        <View style={styles.dataContainer}>
          <Text style={styles.dataText}>위도 (Latitude): {location.coords.latitude.toFixed(6)}</Text>
          <Text style={styles.dataText}>경도 (Longitude): {location.coords.longitude.toFixed(6)}</Text>
          <Text style={styles.dataText}>고도 (Altitude): {location.coords.altitude?.toFixed(2) ?? 'N/A'} m</Text>
          {/* <Text style={styles.dataText}>속도 (Speed): {location.coords.speed?.toFixed(2) ?? 'N/A'} m/s</Text> */}
          <Text style={styles.dataText}>속도 (Speed): {' '}{location.coords.speed!=null?(location.coords.speed*3.6).toFixed(1):'N/A'}{' '}km/h</Text>
          <Text style={styles.dataText}>방향 (Heading): {location.coords.heading?.toFixed(2) ?? 'N/A'} °</Text>
          <Text style={styles.dataText}>정확도 (Accuracy): {location.coords.accuracy?.toFixed(2) ?? 'N/A'} m</Text>
          <Text style={styles.dataText}>타임스탬프 (Timestamp): {new Date(location.timestamp).toLocaleString('ko-KR')}</Text>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{text}</Text>
        </View>
      )}
    </View>
  );
}

// 5. 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  dataContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#555',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#666',
  },
});
