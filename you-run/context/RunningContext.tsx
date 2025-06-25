import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Location from 'expo-location';

const LOCATION_TASK_NAME = 'background-location-task';

interface RunningState {
  isActive: boolean;
  elapsedTime: number;
  path: Location.LocationObjectCoords[];
  startRunning: () => void;
  stopRunning: () => void;
}

const RunningContext = createContext<RunningState | undefined>(undefined);

export const RunningProvider = ({ children }: { children: React.ReactNode }) => {
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [path, setPath] = useState<Location.LocationObjectCoords[]>([]);
  
  const timerInterval = useRef<number | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // 스톱워치 로직
  useEffect(() => {
    if (isActive) {
      timerInterval.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [isActive]);

  // GPS 시작/정지 로직
  const startLocationTracking = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('Foreground permission not granted!');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.log('Background permission not granted!');
      return;
    }
    
    // 포그라운드에서 위치 업데이트를 구독하여 실시간으로 경로(path) 상태를 업데이트
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000, // 1초마다
        distanceInterval: 10, // 10미터마다
      },
      (location) => {
        setPath(prevPath => [...prevPath, location.coords]);
      }
    );

    // 백그라운드 위치 업데이트 시작
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000,
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: '러닝 중',
        notificationBody: '앱이 백그라운드에서 위치를 추적하고 있습니다.',
      },
    });
  };

  const stopLocationTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  };

  const startRunning = () => {
    setPath([]);
    setElapsedTime(0);
    setIsActive(true);
    startLocationTracking();
  };

  const stopRunning = () => {
    setIsActive(false);
    stopLocationTracking();
    // 여기서 최종 path와 elapsedTime을 서버에 저장하는 API를 호출할 수 있습니다.
  };

  return (
    <RunningContext.Provider value={{ isActive, elapsedTime, path, startRunning, stopRunning }}>
      {children}
    </RunningContext.Provider>
  );
};

export const useRunning = () => {
  const context = useContext(RunningContext);
  if (!context) {
    throw new Error('useRunning must be used within a RunningProvider');
  }
  return context;
};
