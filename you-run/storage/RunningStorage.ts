import AsyncStorage from '@react-native-async-storage/async-storage';

const PATH_KEY = '@running_paths'; // 이름 변경

export async function savePath(
  path: { latitude: number; longitude: number }[]
) {
  try {
    const jsonValue = await AsyncStorage.getItem(PATH_KEY);
    const paths: { latitude: number; longitude: number }[][] = jsonValue
      ? JSON.parse(jsonValue)
      : [];

    paths.unshift(path); // 최신 경로를 맨 앞에 push

    await AsyncStorage.setItem(PATH_KEY, JSON.stringify(paths));
    console.log('경로 스택 저장 완료');
  } catch (e) {
    console.error('경로 저장 실패:', e);
  }
}

export async function loadPaths(): Promise<
  { latitude: number; longitude: number }[][]
> {
  try {
    const jsonValue = await AsyncStorage.getItem(PATH_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('경로 불러오기 실패:', e);
    return [];
  }
}

export async function clearPaths() {
  try {
    await AsyncStorage.removeItem(PATH_KEY);
    console.log('모든 경로 삭제 완료');
  } catch (e) {
    console.error('경로 삭제 실패:', e);
  }
}
