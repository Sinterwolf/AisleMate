import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { callFriend, textFriendToGrabSomething } from '../services/calls';
import { unfriend } from '../services/friends';
import type { FriendWithProfile } from '../types';

function statusText(friend: FriendWithProfile): string {
  if (!friend.location || !friend.location.sharing) return 'Not sharing location';
  if (friend.location.store) return `At ${friend.location.store.name}`;
  return 'Location unknown';
}

export default function FriendListItem({ friend }: { friend: FriendWithProfile }) {
  function confirmUnfriend() {
    Alert.alert(
      'Remove friend',
      `Remove ${friend.profile.displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => unfriend(friend.friendshipId) },
      ]
    );
  }

  return (
    <Pressable style={styles.row} onLongPress={confirmUnfriend} delayLongPress={400}>
      <Avatar name={friend.profile.displayName} />
      <View style={styles.info}>
        <Text style={styles.name}>{friend.profile.displayName}</Text>
        <Text style={styles.status}>{statusText(friend)}</Text>
      </View>
      <Pressable
        style={styles.iconButton}
        onPress={() =>
          textFriendToGrabSomething(
            friend.profile.phoneNumber,
            friend.profile.displayName,
            friend.location?.store?.name
          )
        }
      >
        <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
      </Pressable>
      <Pressable
        style={[styles.iconButton, styles.callButton]}
        onPress={() => callFriend(friend.profile.phoneNumber, friend.profile.displayName)}
      >
        <Ionicons name="call" size={18} color="#fff" />
      </Pressable>
    </Pressable>
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
  iconButton: {
    backgroundColor: '#9b9b9b',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  callButton: { backgroundColor: '#1F8A70' },
});
