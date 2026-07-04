import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from '../navigation/types';
import { useFriends } from '../contexts/FriendsContext';
import { respondToFriendRequest } from '../services/friends';
import FriendListItem from '../components/FriendListItem';

type Props = NativeStackScreenProps<FriendsStackParamList, 'FriendsList'>;

export default function FriendsListScreen({ navigation }: Props) {
  const { friends, incomingRequests } = useFriends();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('AddFriend')}>
          <Ionicons name="person-add" size={22} color="#1F8A70" />
        </Pressable>
      </View>

      {incomingRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          {incomingRequests.map((request) => (
            <View key={request.friendshipId} style={styles.requestRow}>
              <Text style={styles.requestName}>{request.fromProfile.displayName}</Text>
              <View style={styles.requestActions}>
                <Pressable
                  style={[styles.requestButton, styles.acceptButton]}
                  onPress={() => respondToFriendRequest(request.friendshipId, true)}
                >
                  <Text style={styles.requestButtonText}>Accept</Text>
                </Pressable>
                <Pressable
                  style={[styles.requestButton, styles.declineButton]}
                  onPress={() => respondToFriendRequest(request.friendshipId, false)}
                >
                  <Text style={[styles.requestButtonText, styles.declineText]}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={friends}
        keyExtractor={(item) => item.friendshipId}
        renderItem={({ item }) => <FriendListItem friend={item} />}
        ListHeaderComponent={
          friends.length > 0 ? <Text style={styles.hint}>Long-press a friend to remove them</Text> : null
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No friends yet. Tap the + icon to add one by email.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '700' },
  addButton: { padding: 6 },
  requestsSection: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 6, textTransform: 'uppercase' },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  requestName: { fontSize: 15, fontWeight: '500' },
  requestActions: { flexDirection: 'row', gap: 8 },
  requestButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  acceptButton: { backgroundColor: '#1F8A70' },
  declineButton: { backgroundColor: '#f2f2f2' },
  requestButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  declineText: { color: '#888' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, paddingHorizontal: 32 },
  hint: { textAlign: 'center', color: '#aaa', fontSize: 12, paddingVertical: 8 },
});
