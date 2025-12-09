import { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RulerPicker } from 'react-native-legend-ruler-picker';

export default function App() {
  const [waterTarget, setWaterTarget] = useState(2000);

  const handleValueChangeEnd = useCallback((value: string) => {
    setWaterTarget(Number(value));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Water Goal</Text>
        <Text style={styles.subtitle}>Set your daily water intake target</Text>
      </View>

      <View style={styles.pickerContainer}>
        <RulerPicker
          min={500}
          max={5000}
          step={5}
          indicatorHeight={80}
          initialValue={waterTarget}
          fractionDigits={0}
          unit="ml"
          onValueChangeEnd={handleValueChangeEnd}
          indicatorColor="#2196F3"
          shortStepColor="#E0E0E0"
          longStepColor="#9E9E9E"
          valueTextStyle={styles.valueText}
          unitTextStyle={styles.unitText}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.goalText}>
          Your goal: {waterTarget.toLocaleString()} ml
        </Text>
        <Text style={styles.glassesText}>
          ≈ {Math.round(waterTarget / 250)} glasses of water
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 30,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  goalText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  glassesText: {
    fontSize: 14,
    color: '#757575',
  },
  valueText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2196F3',
  },
  unitText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#757575',
  },
});
