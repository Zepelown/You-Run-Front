import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
// 새로 만든 플로팅 버튼 컴포넌트를 import 합니다.
import FloatingMenuButton from '@/components/FloatingMenuButton';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 
        화면 콘텐츠를 담는 View와 별개로 FloatingMenuButton을 렌더링합니다.
        버튼은 'absolute' 위치이므로, 다른 View의 레이아웃에 영향을 주지 않습니다.
      */}
      <FloatingMenuButton />

      <View style={styles.content}>
        <Text>홈 화면 콘텐츠</Text>
        <Text>화면 왼쪽 상단에 햄버거 버튼만 보입니다.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
