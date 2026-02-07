import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LeavingModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LeavingModal({ visible, onClose }: LeavingModalProps) {
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(1);
      setTimeLeft(300);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (step !== 3) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - timeLeft / 300);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {step === 1 && (
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>When are you leaving?</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#8A8D91" />
              </TouchableOpacity>
            </View>
            <View style={styles.options}>
              {['Now', '2 min', '5 min', '10 min'].map((label) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => setStep(2)}
                  style={styles.optionButton}
                >
                  <Text style={styles.optionText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Confirm your spot</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#8A8D91" />
              </TouchableOpacity>
            </View>

            {/* Map preview placeholder */}
            <View style={styles.mapPreview}>
              <Ionicons name="location" size={48} color="#7FA98E" />
            </View>

            <View style={styles.locationCard}>
              <Text style={styles.locationName}>Market Street</Text>
              <Text style={styles.locationSub}>Between 5th & 6th Ave</Text>
            </View>

            {/* Earn credits */}
            <View style={styles.creditsBanner}>
              <Ionicons name="trophy" size={28} color="#FFFFFF" />
              <View>
                <Text style={styles.creditsTitle}>Earn 10 credits</Text>
                <Text style={styles.creditsSub}>Help others find parking</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setStep(3)}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmText}>Confirm & Share</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.centerSheet}>
            <Text style={styles.sheetTitle}>Leaving soon</Text>

            <View style={styles.countdownContainer}>
              <Svg width={192} height={192} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Defs>
                  <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#8B9D83" />
                    <Stop offset="100%" stopColor="#7FA98E" />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx={96}
                  cy={96}
                  r={radius}
                  stroke="#D3D5D7"
                  strokeWidth={8}
                  fill="none"
                />
                <Circle
                  cx={96}
                  cy={96}
                  r={radius}
                  stroke="url(#grad)"
                  strokeWidth={8}
                  fill="none"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={progress}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.countdownText}>
                <Text style={styles.countdownValue}>
                  {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={styles.countdownLabel}>remaining</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.confirmButton}>
              <Text style={styles.confirmText}>I've left</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStep(1)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Need more time</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  centerSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    margin: 24,
    alignItems: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4A4F55',
  },
  options: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#F5F1E8',
    borderWidth: 1,
    borderColor: '#D3D5D7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4F55',
  },
  mapPreview: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#E8EDE8',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D3D5D7',
  },
  locationCard: {
    backgroundColor: '#F5F1E8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D3D5D7',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4F55',
    marginBottom: 4,
  },
  locationSub: {
    fontSize: 14,
    color: '#8A8D91',
  },
  creditsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#7FA98E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  creditsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creditsSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  confirmButton: {
    backgroundColor: '#7FA98E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F5F1E8',
    borderWidth: 1,
    borderColor: '#D3D5D7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  secondaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4A4F55',
  },
  countdownContainer: {
    width: 192,
    height: 192,
    marginVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    position: 'absolute',
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#4A4F55',
  },
  countdownLabel: {
    fontSize: 14,
    color: '#8A8D91',
    marginTop: 4,
  },
});
