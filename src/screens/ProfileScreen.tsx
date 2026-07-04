import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Avatar from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useLocationSharing } from '../contexts/LocationContext';
import { signOut, updatePhoneNumber } from '../services/auth';

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const { sharing, startSharing, stopSharing } = useLocationSharing();
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  function beginEdit() {
    setPhoneDraft(profile!.phoneNumber);
    setEditingPhone(true);
  }

  async function savePhone() {
    if (!user) return;
    setSaving(true);
    try {
      await updatePhoneNumber(user.uid, phoneDraft);
      setEditingPhone(false);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar name={profile.displayName} size={72} />
        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Phone number</Text>
        {editingPhone ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.phoneInput}
              value={phoneDraft}
              onChangeText={setPhoneDraft}
              keyboardType="phone-pad"
              autoFocus
              placeholder="Phone number"
            />
            <Pressable onPress={savePhone} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#1F8A70" />
              ) : (
                <Text style={styles.link}>Save</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={beginEdit}>
            <Text style={[styles.rowValue, styles.link]}>{profile.phoneNumber || 'Add a number'}</Text>
          </Pressable>
        )}
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
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 15,
    minWidth: 150,
  },
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
