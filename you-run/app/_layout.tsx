import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerProvider, useDrawer } from '@/context/DrawerContext'; // 경로 확인
import CustomDrawer from '@/components/CustomDrawer'; // 경로 확인

// app/_layout.tsx 최상단 (import 구문 아래)
import * as TaskManager from 'expo-task-manager';
import { TaskManagerTaskBody } from 'expo-task-manager';
import * as Location from 'expo-location';
import { RunningProvider } from '@/context/RunningContext';

const LOCATION_TASK_NAME = 'background-location-task';

interface LocationTaskData {
  locations: Location.LocationObject[];
}

TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async (body: TaskManagerTaskBody<LocationTaskData>) => {
    // 함수 본문 안에서 body로부터 data와 error를 구조 분해합니다.
    const { data, error } = body;

    if (error) {
      console.error('TaskManager Error:', error);
      return;
    }
    if (data) {
      const { locations } = data;
      console.log(`[${LOCATION_TASK_NAME}] Received new locations:`, locations.length);

      // 여기에 위치 정보를 저장하는 로직을 추가합니다.
      // 예: 다른 파일의 함수를 호출하여 상태를 업데이트하거나 AsyncStorage에 저장
      // saveLocationsToStorage(locations); 
    }
  }
);

function RootLayoutNav() {
  const { isMenuVisible, closeMenu } = useDrawer();

  return (
    <>
      {/* screenOptions를 사용하여 모든 스크린의 헤더를 숨깁니다. */}
      <Stack screenOptions={{ headerShown: false }}>
      </Stack>
      {isMenuVisible && <CustomDrawer closeMenu={closeMenu} />}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <RunningProvider>
      <DrawerProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </DrawerProvider>
    </RunningProvider>

  );
}