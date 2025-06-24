import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ScrollView, Alert, Platform} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as FileSystem from 'expo-file-system';

const LOCATION_TASK_NAME = 'background-location-task';
const logFilePath = FileSystem.documentDirectory + 'gps_log.txt';

// 파일에 로그를 추가하는 수정된 함수
const appendLogToFile = async (log: string) => {
  try {
    let existingContent = '';
    // 1. 파일이 존재하는지 먼저 확인하고, 있다면 내용을 읽어옵니다.
    try {
      existingContent = await FileSystem.readAsStringAsync(logFilePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (e) {
      // 파일이 존재하지 않으면 readAsStringAsync가 오류를 발생시킵니다.
      // 이 경우 기존 내용은 빈 문자열이므로, 오류를 무시하고 계속 진행합니다.
    }

    // 2. 새로운 로그를 기존 내용 뒤에 덧붙입니다.
    const newContent = existingContent + log + '\n';

    // 3. 합쳐진 전체 내용을 파일에 다시 씁니다. (덮어쓰기)
    await FileSystem.writeAsStringAsync(logFilePath, newContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error('Failed to write log to file', error);
  }
};


// TaskManager가 실행할 작업을 정의합니다.
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  const now = new Date();
  if (error) {
    await appendLogToFile(`[${now.toISOString()}] Error: ${error.message}`);
    return;
  }
  if (data) {
    // data 객체에서 locations 배열을 추출합니다.
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    if (location) {
      const logMessage = `[${now.toISOString()}] Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}`;
      await appendLogToFile(logMessage);
      console.log('Received new location:', logMessage); // 개발 중 확인용 콘솔 로그
    }
  }
});


export default function GpsScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [logs, setLogs] = useState('');

  // 컴포넌트가 로드될 때 추적 상태를 확인
  useEffect(() => {
    const checkTrackingStatus = async () => {
      const trackingStatus = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(trackingStatus);
    };
    checkTrackingStatus();
  }, []);

  // 백그라운드 위치 정보 수집 시작 함수
  const startBackgroundUpdate = async () => {
    // 1. 포그라운드 권한 요청
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert('권한 필요', '포그라운드 위치 정보 접근 권한이 필요합니다.');
      return;
    }
    
    // 2. 백그라운드 권한 요청
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      Alert.alert('권한 필요', '백그라운드 위치 정보 접근 권한이 필요합니다.');
      return;
    }

    // 3. 백그라운드 작업 시작
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000, // 5초 간격
      distanceInterval: 1, // 1미터 이상 움직일 때
      showsBackgroundLocationIndicator: true, // 백그라운드에서 실행 중임을 아이콘으로 표시
      foregroundService: { // 안드로이드 필수 설정[3]
        notificationTitle: '위치 추적 중',
        notificationBody: '앱이 백그라운드에서 위치를 기록하고 있습니다.',
        notificationColor: '#333333',
      },
    });
    setIsTracking(true);
    Alert.alert('추적 시작', '백그라운드 위치 추적을 시작합니다.');
  };

  // 백그라운드 위치 정보 수집 중지 함수
  const stopBackgroundUpdate = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setIsTracking(false);
    Alert.alert('추적 중지', '백그라운드 위치 추적을 중지했습니다.');
  };

  // 저장된 로그 파일 읽어오기
  const readLogs = async () => {
    try {
      const fileContent = await FileSystem.readAsStringAsync(logFilePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setLogs(fileContent);
    } catch (e) {
      setLogs('로그 파일이 없거나 읽을 수 없습니다.');
    }
  };
  
  // 로그 파일 삭제
  const deleteLogs = async () => {
    try {
      await FileSystem.deleteAsync(logFilePath);
      setLogs('');
      Alert.alert('삭제 완료', '로그 파일이 삭제되었습니다.');
    } catch (e) {
      Alert.alert('삭제 실패', '로그 파일을 삭제하는 데 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>백그라운드 GPS 로깅</Text>
      <View style={styles.buttonContainer}>
        <Button
          title={isTracking ? '추적 중지' : '추적 시작'}
          onPress={isTracking ? stopBackgroundUpdate : startBackgroundUpdate}
          color={isTracking ? '#e74c3c' : '#2ecc71'}
        />
      </View>
      <View style={styles.logControlContainer}>
        <Button title="로그 불러오기" onPress={readLogs} />
        <Button title="로그 삭제" onPress={deleteLogs} color="#f39c12" />
      </View>
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logText}>{logs || '로그를 불러와주세요.'}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 스타일 정의 (이전 예제와 유사하게 구성)
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  buttonContainer: { marginBottom: 20 },
  logControlContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  logContainer: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 },
  logText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }, // 고정폭 글꼴 사용
});