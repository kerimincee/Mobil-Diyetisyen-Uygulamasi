import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

export function CustomTabBarButton({ isCenter, children, ...props }: BottomTabBarButtonProps & { isCenter?: boolean }) {
  if (isCenter) {
    return (
      <View style={styles.centerButtonWrapper}>
        <PlatformPressable {...props} style={styles.centerButton}>
          <Image source={require('../assets/images/diyetasistani.png')} style={styles.centerImage} />
        </PlatformPressable>
      </View>
    );
  }
  return <HapticTab {...props}>{children}</HapticTab>;
}

const styles = StyleSheet.create({
  centerButtonWrapper: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4B6C4B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 4,
    borderColor: '#F8FAF7',
  },
  centerImage: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
});
