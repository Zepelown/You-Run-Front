// 파일 경로: app/(drawer)/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          // 모든 스크린에 공통으로 적용될 옵션
          headerTitle: '', // 헤더 제목을 비워서 버튼만 보이게 함
        }}
      >
        {/* 
          아래 name 속성은 실제 파일 이름과 일치해야 합니다.
          (단, .tsx 확장자는 제외)
        */}
        <Drawer.Screen
          name="index" // app/(drawer)/index.tsx 파일을 가리킴
          options={{
            drawerLabel: '메인 화면', // 드로어 메뉴에 보일 텍스트
          }}
        />
        <Drawer.Screen
          name="explore" // app/(drawer)/explore.tsx 파일을 가리킴
          options={{
            drawerLabel: '탐험하기',
          }}
        />
        <Drawer.Screen
          name="gps" // app/(drawer)/gps.tsx 파일을 가리킴
          options={{
            drawerLabel: 'GPS 기록',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
