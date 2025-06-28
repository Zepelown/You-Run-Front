import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { loadPaths } from '@/storage/RunningStorage';

export default function MyRunningPath() {
  const [path, setPath] = useState<{ latitude: number; longitude: number }[]>(
    []
  );
  const [region, setRegion] = useState<Region | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchPath = async () => {
      const loadedPaths = await loadPaths();
      if (loadedPaths.length > 0) {
        const latestPath = loadedPaths[0];
        setPath(latestPath);
        setRegion({
          latitude: latestPath[0].latitude,
          longitude: latestPath[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    };

    fetchPath();
  }, []);

  if (!region) {
    return (
      <View style={styles.center}>
        <Text>저장된 경로를 불러오는 중...</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.navigate('index')}
        >
          <Text style={styles.backButtonText}>메뉴로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation={true}
      >
        <Polyline coordinates={path} strokeColor="#007aff" strokeWidth={5} />
        {path.length > 0 && (
          <Marker coordinate={path[path.length - 1]}>
            <View style={styles.marker} />
          </Marker>
        )}
      </MapView>
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.navigate('index')}
      >
        <Text style={styles.backButtonText}>메뉴로 돌아가기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    width: 10,
    height: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#007aff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
