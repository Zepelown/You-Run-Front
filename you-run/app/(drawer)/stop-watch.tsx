import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const milliseconds = Math.floor((time % 1000) / 10);

  const format = (num: number) => num.toString().padStart(2, '0');

  return `${format(minutes)}:${format(seconds)}.${format(milliseconds)}`;
};

export default function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [laps, setLaps] = useState<number[]>([]);

  // ⭐️ 여기를 수정했습니다: NodeJS.Timeout -> number
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      // setInterval은 number 타입의 ID를 반환합니다.
      intervalRef.current = window.setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    }

    return () => {
      // clearInterval은 number 타입의 ID를 받습니다.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (isActive) {
      setLaps([time, ...laps]);
    }
  };

  // UI 부분은 동일하므로 생략하지 않고 전체 코드를 제공합니다.
  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(time)}</Text>
      </View>
      <ScrollView style={styles.lapsContainer}>
        {laps.map((lap, index) => (
          <View key={index} style={styles.lap}>
            <Text style={styles.lapText}>Lap {laps.length - index}</Text>
            <Text style={styles.lapText}>{formatTime(lap)}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
          disabled={isActive}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.startStopButton]} onPress={isActive ? handlePauseResume : handleStart}>
          <Text style={styles.buttonText}>
            {!isActive ? 'Start' : isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.lapButton]}
          onPress={handleLap}
          disabled={!isActive || isPaused}
        >
          <Text style={styles.buttonText}>Lap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 스타일 시트는 동일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
    paddingTop: 100,
  },
  timerContainer: {
    borderWidth: 2,
    borderColor: '#778DA9',
    width: '80%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '200',
    color: '#E0E1DD',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 50,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  startStopButton: {
    borderColor: '#415A77',
    backgroundColor: 'rgba(65, 90, 119, 0.3)',
  },
  resetButton: {
    borderColor: '#778DA9',
  },
  lapButton: {
    borderColor: '#778DA9',
  },
  buttonText: {
    color: '#E0E1DD',
    fontSize: 16,
  },
  lapsContainer: {
    width: '80%',
    flex: 1,
  },
  lap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#415A77',
  },
  lapText: {
    color: '#BDBDBD',
    fontSize: 18,
  },
});
