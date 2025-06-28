import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface FacePaceScreenProps {}

const FacePaceScreen: React.FC<FacePaceScreenProps> = () => {
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [showMessage, setShowMessage] = useState<boolean>(true);
  const [isHelpMode, setIsHelpMode] = useState<boolean>(false);

  // 컴포넌트 마운트 시 3초 후 메시지 자동 사라지기
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 3000); // 3초 후 사라짐

    return () => clearTimeout(timer);
  }, []);

  const formatTime = (time: number): string => {
    return time.toString().padStart(2, '0');
  };

  const handleHelpPress = () => {
    if (isHelpMode && showMessage) {
      // 도움말 모드이면서 메시지가 보이는 상태라면 메시지를 숨김
      setShowMessage(false);
      setIsHelpMode(false);
    } else {
      // 그렇지 않다면 도움말을 보여줌
      setIsHelpMode(true);
      setShowMessage(true);
    }
  };

  const handleComplete = () => {
    // 실제 페이스 설정 완료 로직
    console.log(`페이스 설정: ${minutes}분 ${seconds}초`);
    // 여기에 저장 로직이나 다음 화면으로 이동 로직 추가
  };

  const getMessageText = (): string => {
    if (isHelpMode) {
      return '이곳은 봇의 대화를 출력하는 곳입니다.\n여러분은 설정하신 시간의 빈도 시간\n동안 봇이 묻고 답하며\n봇의 화면에 설정해 주어\n봇의 페이스를 설정해주세요';
    }
    return '봇의 페이스를 설정\n해주세요.';
  };

  // 분과 초를 위한 배열 생성
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);
  const secondsArray = Array.from({ length: 60 }, (_, i) => i);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={handleHelpPress}
        >
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* Character and Message */}
      <View style={styles.messageContainer}>
        {showMessage && (
          <View style={styles.speechBubble}>
            <Text style={styles.messageText}>{getMessageText()}</Text>
          </View>
        )}
        <View style={styles.characterContainer}>
          <View style={styles.character}>
            <View style={styles.hat} />
            <View style={styles.face}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.wing} />
          </View>
        </View>
      </View>

      {/* Pace Setting Button */}
      <TouchableOpacity style={styles.paceButton}>
        <Text style={styles.paceButtonText}>페이스 설정</Text>
      </TouchableOpacity>

      {/* Time Selector with Wheel Picker */}
      <View style={styles.timeContainer}>
        <View style={styles.pickerSection}>
          <Text style={styles.timeLabel}>분</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={minutes}
              style={styles.picker}
              onValueChange={(itemValue) => setMinutes(itemValue)}
              itemStyle={styles.pickerItem}
            >
              {minutesArray.map((minute) => (
                <Picker.Item
                  key={minute}
                  label={formatTime(minute)}
                  value={minute}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerSection}>
          <Text style={styles.timeLabel}>초</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={seconds}
              style={styles.picker}
              onValueChange={(itemValue) => setSeconds(itemValue)}
              itemStyle={styles.pickerItem}
            >
              {secondsArray.map((second) => (
                <Picker.Item
                  key={second}
                  label={formatTime(second)}
                  value={second}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Selected Time Display */}
      <View style={styles.selectedTimeContainer}>
        <Text style={styles.selectedTimeText}>
          선택된 시간: {formatTime(minutes)}분 {formatTime(seconds)}초
        </Text>
      </View>

      {/* Info Text */}
      <Text style={styles.infoText}>봇의 페이스 시간을 설정해 주세요</Text>

      {/* Complete Button */}
      <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
        <Text style={styles.completeButtonText}>완료</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  helpButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    minHeight: 120, // 메시지가 사라져도 레이아웃 유지
  },
  speechBubble: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
  },
  characterContainer: {
    position: 'relative',
  },
  character: {
    alignItems: 'center',
  },
  hat: {
    width: 40,
    height: 25,
    backgroundColor: '#6a4c93',
    borderRadius: 20,
    marginBottom: -5,
  },
  face: {
    width: 60,
    height: 60,
    backgroundColor: '#ffd93d',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
  },
  eye: {
    width: 6,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
  },
  wing: {
    position: 'absolute',
    right: -15,
    top: 35,
    width: 20,
    height: 15,
    backgroundColor: '#ffa500',
    borderRadius: 10,
  },
  paceButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  paceButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  pickerSection: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  picker: {
    height: 120,
    width: '100%',
  },
  pickerItem: {
    fontSize: 18,
    height: 120,
  },
  selectedTimeContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  selectedTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 50,
    alignSelf: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FacePaceScreen;