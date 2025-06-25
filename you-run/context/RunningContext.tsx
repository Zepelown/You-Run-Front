// context/RunningContext.tsx

import * as Location from 'expo-location';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const LOCATION_TASK_NAME = 'background-location-task';

interface RunningState {
  isActive: boolean;
  elapsedTime: number;
  path: { latitude: number; longitude: number }[];
  currentSpeed: number;
  startRunning: () => void;
  stopRunning: () => void;
}

const RunningContext = createContext<RunningState | undefined>(undefined);

export const RunningProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [path, setPath] = useState<{ latitude: number; longitude: number }[]>(
    []
  );
  const [currentSpeed, setCurrentSpeed] = useState(0);

  const timerInterval = useRef<number | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );

  // 스톱워치 로직
  useEffect(() => {
    if (isActive) {
      timerInterval.current = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    } else if (timerInterval.current !== null) {
      clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current !== null) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isActive]);

  // 위치 구독 시작
  const startLocationTracking = async () => {
    // 1) foreground 위치 구독 (권한 실패와 무관하게 실행)
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (location) => {
        //console.log('📍 위치 업데이트 콜백:', location.coords);
        const { latitude, longitude, speed } = location.coords;
        setPath((prev) => [...prev, { latitude, longitude }]);
        setCurrentSpeed(speed != null ? speed * 3.6 : 0);
      }
    );

    // 2) foreground 권한 요청 (구독은 이미 시작됨)
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      console.warn('Foreground permission not granted!');
    }

    // 3) background 권한 요청 및 백그라운드 위치 업데이트
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus === 'granted') {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 1,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: '러닝 중',
          notificationBody: '백그라운드에서 위치를 추적 중입니다.',
        },
      });
    } else {
      console.warn('Background permission not granted, continuing foreground only.');
    }
  };

  // 위치 구독 정지
  const stopLocationTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  };

  const startRunning = () => {
    setPath([]);
    setElapsedTime(0);
    setCurrentSpeed(0);
    setIsActive(true);
    startLocationTracking();
  };

  const stopRunning = () => {
    setIsActive(false);
    stopLocationTracking();
    // 여기에서 path/elapsedTime 등을 서버에 저장할 수 있습니다.
  };

  return (
    <RunningContext.Provider
      value={{
        isActive,
        elapsedTime,
        path,
        currentSpeed,
        startRunning,
        stopRunning,
      }}
    >
      {children}
    </RunningContext.Provider>
  );
};

export const useRunning = () => {
  const context = useContext(RunningContext);
  if (!context) {
    throw new Error('useRunning must be used within RunningProvider');
  }
  return context;
};
