import { useContext } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import { LoadingContext } from '../contexts/LoadingContext';

const { width, height } = Dimensions.get('window');

export default function LoadingOverlay() {
  const { showLoading } = useContext(LoadingContext);
  if (!showLoading) return null;
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#4B6C4B" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
}); 