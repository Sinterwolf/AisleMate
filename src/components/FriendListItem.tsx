import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { callFriend } from '../services/calls';
import type { FriendWithProfile } from '../types';

function statusText(friend: FriendWithProfile): string {
  if (!friend.location || !friend.location.sharing) return 'Not sharing location';
  if (friend.location.store) return `At ${friend.location.store.name}`;
  return 'Location unknown';
}

export default function FriendListItem({ friend }: { friend: FriendWithProfile }) {
  return (
    <View style={styles.row}>
      <Avatar name={friend.profile.displayName} />
      <View style={styles.info}>
        <Text style={styles.name}>{friend.profile.displayName}</Text>
        <Text style={styles.status}>{statusText(friend)}</Text>
      </View>
      <Pressable
        style={styles.callButton}
        onPress={() => callFriend(friend.profile.phoneNumber, friend.profile.displayName)}
      >
        <Ionicons name="call" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 13, color: '#777', marginTop: 2 },
  callButton: {
    backgroundColor: '#1F8A70',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
