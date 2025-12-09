// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';

import { Dimensions, StyleSheet, View, Text, Animated } from 'react-native';

import type {
  TextStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { AnimatedLegendList } from '@legendapp/list/animated';

import type { LegendListRef } from '@legendapp/list';

import { RulerPickerItem } from './ruler-picker-item';

import type { RulerPickerItemProps } from './ruler-picker-item';

import { calculateCurrentValue } from '../utils/calculations';

export type RulerPickerTextProps = Pick<
  TextStyle,
  'color' | 'fontSize' | 'fontWeight'
>;

const { width: windowWidth } = Dimensions.get('window');

export type RulerPickerProps = {
  /**
   * Width of the ruler picker
   * @default windowWidth
   */
  width?: number;
  /**
   * Height of the ruler picker
   * @default 500
   */
  height?: number;
  /**
   * Minimum value of the ruler picker
   *
   * @default 0
   */
  min: number;
  /**
   * Maximum value of the ruler picker
   *
   * @default 240
   */
  max: number;
  /**
   * Step of the ruler picker
   *
   * @default 1
   */
  step?: number;
  /**
   * Initial value of the ruler picker
   *
   * @default min
   */
  initialValue?: number;
  /**
   * Number of digits after the decimal point
   *
   * @default 1
   */
  fractionDigits?: number;
  /**
   * Unit of the ruler picker
   *
   * @default 'cm'
   */
  unit?: string;
  /**
   * Height of the indicator
   *
   * @default 80
   */
  indicatorHeight?: number;
  /**
   * Color of the center line
   *
   * @default 'black'
   */
  indicatorColor?: string;
  /**
   * Text style of the value
   */
  valueTextStyle?: RulerPickerTextProps;
  /**
   * Text style of the unit
   */
  unitTextStyle?: RulerPickerTextProps;
  /**
   * A floating-point number that determines how quickly the scroll view
   * decelerates after the user lifts their finger. You may also use string
   * shortcuts `"normal"` and `"fast"` which match the underlying iOS settings
   * for `UIScrollViewDecelerationRateNormal` and
   * `UIScrollViewDecelerationRateFast` respectively.
   *
   *  - `'normal'`: 0.998 on iOS, 0.985 on Android (the default)
   *  - `'fast'`: 0.99 on iOS, 0.9 on Android
   *
   * @default 'normal'
   */
  decelerationRate?: 'fast' | 'normal' | number;
  /**
   * Callback when the value changes
   *
   * @param value
   */
  onValueChange?: (value: string) => void;
  /**
   * Callback when the value changes end
   *
   * @param value
   */
  onValueChangeEnd?: (value: string) => void;
} & Partial<RulerPickerItemProps>;

export const RulerPicker = ({
  width = windowWidth,
  height = 500,
  min,
  max,
  step = 1,
  initialValue = min,
  fractionDigits = 1,
  unit = 'cm',
  indicatorHeight = 80,
  gapBetweenSteps = 10,
  shortStepHeight = 20,
  longStepHeight = 40,
  stepWidth = 2,
  indicatorColor = 'black',
  shortStepColor = 'lightgray',
  longStepColor = 'darkgray',
  valueTextStyle,
  unitTextStyle,
  decelerationRate = 'normal',
  onValueChange,
  onValueChangeEnd,
}: RulerPickerProps) => {
  const itemAmount = (max - min) / step;
  const arrData: number[] = Array.from(
    { length: itemAmount + 1 },
    (_, index) => index
  );

  const listRef = useRef<LegendListRef>(null);

  const [displayValue, setDisplayValue] = useState(
    initialValue.toFixed(fractionDigits)
  );
  const prevValue = useRef<string>(initialValue.toFixed(fractionDigits));
  const prevMomentumValue = useRef<string>(
    initialValue.toFixed(fractionDigits)
  );
  const scrollPosition = useRef(new Animated.Value(0)).current;

  const valueCallback = useCallback(
    ({ value }: { value: number }) => {
      const newStep = calculateCurrentValue(
        value,
        stepWidth,
        gapBetweenSteps,
        min,
        max,
        step,
        fractionDigits
      );

      if (prevValue.current !== newStep) {
        onValueChange?.(newStep);
        setDisplayValue(newStep);
      }

      prevValue.current = newStep;
    },
    [fractionDigits, gapBetweenSteps, stepWidth, max, min, onValueChange, step]
  );

  useEffect(() => {
    const listenerId = scrollPosition.addListener(valueCallback);

    return () => {
      scrollPosition.removeListener(listenerId);
    };
  }, [scrollPosition, valueCallback]);

  const scrollHandler = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            x: scrollPosition,
          },
        },
      },
    ],
    {
      useNativeDriver: true,
    }
  );

  const renderSeparator = useCallback(
    () => <View style={{ width: width * 0.5 - stepWidth * 0.5 }} />,
    [stepWidth, width]
  );

  const renderItem = useCallback(
    ({ index }: { item: number; index: number }) => {
      return (
        <RulerPickerItem
          isLast={index === arrData.length - 1}
          index={index}
          shortStepHeight={shortStepHeight}
          longStepHeight={longStepHeight}
          gapBetweenSteps={gapBetweenSteps}
          stepWidth={stepWidth}
          shortStepColor={shortStepColor}
          longStepColor={longStepColor}
        />
      );
    },
    [
      arrData.length,
      gapBetweenSteps,
      stepWidth,
      longStepColor,
      longStepHeight,
      shortStepColor,
      shortStepHeight,
    ]
  );

  const scrollEndTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrolling = useRef(false);

  const handleScrollEnd = useCallback(
    (offset: number) => {
      // Calculate the snapped offset
      const stepSize = stepWidth + gapBetweenSteps;
      const snappedIndex = Math.round(offset / stepSize);
      const snappedOffset = snappedIndex * stepSize;

      // Calculate value from snapped position
      const newStep = calculateCurrentValue(
        snappedOffset,
        stepWidth,
        gapBetweenSteps,
        min,
        max,
        step,
        fractionDigits
      );

      if (prevMomentumValue.current !== newStep) {
        onValueChangeEnd?.(newStep);
      }

      prevMomentumValue.current = newStep;
      isScrolling.current = false;
    },
    [
      fractionDigits,
      gapBetweenSteps,
      stepWidth,
      max,
      min,
      onValueChangeEnd,
      step,
    ]
  );

  const scheduleScrollEnd = useCallback(
    (offset: number) => {
      // Clear any pending timeout
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }

      // Delay to allow snap animation to complete
      scrollEndTimeout.current = setTimeout(() => {
        handleScrollEnd(offset);
      }, 150);
    },
    [handleScrollEnd]
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.x;
      scheduleScrollEnd(offset);
    },
    [scheduleScrollEnd]
  );

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.x;
      isScrolling.current = true;

      // Schedule scroll end - will be cancelled if momentum scroll starts
      scheduleScrollEnd(offset);
    },
    [scheduleScrollEnd]
  );

  const onScrollBeginDrag = useCallback(() => {
    // Clear any pending end callback when new scroll starts
    if (scrollEndTimeout.current) {
      clearTimeout(scrollEndTimeout.current);
    }
    isScrolling.current = true;
  }, []);

  const onMomentumScrollBegin = useCallback(() => {
    // Clear the drag end timeout since momentum is taking over
    if (scrollEndTimeout.current) {
      clearTimeout(scrollEndTimeout.current);
    }
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollEndTimeout.current) {
        clearTimeout(scrollEndTimeout.current);
      }
    };
  }, []);

  const onContentSizeChange = useCallback(() => {
    const initialIndex = Math.floor((initialValue - min) / step);
    listRef.current?.scrollToOffset({
      offset: initialIndex * (stepWidth + gapBetweenSteps),
      animated: false,
    });
  }, [initialValue, min, step, stepWidth, gapBetweenSteps]);

  return (
    <View
      style={{ width, height, justifyContent: 'center', alignItems: 'center' }}
    >
      {/* Value and Unit Text - positioned above */}
      <View style={styles.textContainer}>
        <Text style={[styles.valueText, valueTextStyle]}>{displayValue}</Text>
        {unit && <Text style={[styles.unitText, unitTextStyle]}>{unit}</Text>}
      </View>

      {/* Ruler List with Indicator */}
      <View style={{ width }}>
        {/* Indicator line - extends up from ruler, overlapping with it */}
        <View
          pointerEvents="none"
          style={{
            alignSelf: 'center',
            width: stepWidth,
            height: indicatorHeight,
            backgroundColor: indicatorColor,
            marginBottom: -longStepHeight,
            zIndex: 10,
          }}
        />

        {/* Ruler List */}

        <View style={{ width, height: longStepHeight }}>
          <AnimatedLegendList
            ref={listRef}
            data={arrData}
            keyExtractor={(_: number, index: number) => index.toString()}
            renderItem={renderItem}
            ListHeaderComponent={renderSeparator}
            ListFooterComponent={renderSeparator}
            onScroll={scrollHandler}
            onScrollBeginDrag={onScrollBeginDrag}
            onScrollEndDrag={onScrollEndDrag}
            onMomentumScrollBegin={onMomentumScrollBegin}
            onMomentumScrollEnd={onMomentumScrollEnd}
            estimatedItemSize={stepWidth + gapBetweenSteps}
            getFixedItemSize={() => stepWidth + gapBetweenSteps}
            recycleItems
            drawDistance={500}
            snapToOffsets={arrData.map(
              (_, index) => index * (stepWidth + gapBetweenSteps)
            )}
            onContentSizeChange={onContentSizeChange}
            snapToAlignment="start"
            decelerationRate={decelerationRate}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            horizontal
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  valueText: {
    color: 'black',
    fontSize: 32,
  },
  unitText: {
    color: 'black',
    fontSize: 24,
    marginLeft: 6,
  },
});
