import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useLocationSharing } from '../contexts/LocationContext';
import { signOut } from '../services/auth';

export default function ProfileScreen() {
  const { profile } = useAuth();
  const { sharing, startSharing, stopSharing } = useLocationSharing();

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar name={profile.displayName} size={72} />
        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Phone number</Text>
        <Text style={styles.rowValue}>{profile.phoneNumber || 'Not set'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Location sharing</Text>
        <Pressable onPress={() => (sharing ? stopSharing() : startSharing())}>
          <Text style={[styles.rowValue, styles.link]}>{sharing ? 'On – tap to stop' : 'Off – tap to start'}</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.signOutButton}
        onPress={() =>
          Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
          ])
        }
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 12 },
  name: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  email: { fontSize: 14, color: '#888', marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowLabel: { fontSize: 15, color: '#333' },
  rowValue: { fontSize: 15, color: '#555' },
  link: { color: '#1F8A70', fontWeight: '600' },
  signOutButton: {
    marginTop: 40,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  signOutText: { color: '#e74c3c', fontWeight: '700' },
});
