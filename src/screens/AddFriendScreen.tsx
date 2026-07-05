import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { findUserByEmail, sendFriendRequest } from '../services/friends';
import type { UserProfile } from '../types';

export default function AddFriendScreen() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<UserProfile | null | undefined>(undefined);
  const [sending, setSending] = useState(false);

  async function handleSearch() {
    if (!email.trim()) return;
    setSearching(true);
    setResult(undefined);
    try {
      const found = await findUserByEmail(email);
      setResult(found);
    } catch (err) {
      Alert.alert('Search failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest() {
    if (!user || !result) return;
    setSending(true);
    try {
      await sendFriendRequest(user.uid, result.uid);
      Alert.alert('Request sent', `Friend request sent to ${result.displayName}.`);
      setResult(undefined);
      setEmail('');
    } catch (err) {
      Alert.alert('Could not send request', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Find a friend by email</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="friend@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleSearch}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} disabled={searching}>
          {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>Search</Text>}
        </Pressable>
      </View>

      {result === null && <Text style={styles.info}>No AisleMate user found with that email.</Text>}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultName}>{result.displayName}</Text>
          <Text style={styles.resultEmail}>{result.email}</Text>
          <Pressable style={styles.sendButton} onPress={handleSendRequest} disabled={sending}>
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Friend Request</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: '#1F8A70',
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: '600' },
  info: { color: '#999', marginTop: 16, textAlign: 'center' },
  resultCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
  },
  resultName: { fontSize: 17, fontWeight: '700' },
  resultEmail: { fontSize: 14, color: '#777', marginTop: 2, marginBottom: 14 },
  sendButton: {
    backgroundColor: '#1F8A70',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  sendButtonText: { color: '#fff', fontWeight: '600' },
});
