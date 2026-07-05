import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#1F8A70',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: '#fff', fontWeight: '700' },
});
