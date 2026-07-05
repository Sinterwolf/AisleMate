import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../contexts/FriendsContext';
import { useLocationSharing } from '../contexts/LocationContext';
import { callFriend } from '../services/calls';

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function FriendsMapScreen() {
  const { friends } = useFriends();
  const { sharing, error, startSharing, stopSharing } = useLocationSharing();
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const position = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  const visibleFriends = friends.filter((f) => f.location?.sharing && f.location.lat && f.location.lng);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={sharing}
      >
        {visibleFriends.map((friend) => (
          <Marker
            key={friend.friendshipId}
            coordinate={{ latitude: friend.location!.lat, longitude: friend.location!.lng }}
            pinColor="#1F8A70"
          >
            <Callout onPress={() => callFriend(friend.profile.phoneNumber, friend.profile.displayName)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{friend.profile.displayName}</Text>
                <Text style={styles.calloutStore}>
                  {friend.location!.store ? `At ${friend.location!.store!.name}` : 'Location unknown'}
                </Text>
                <Text style={styles.calloutAction}>Tap to call</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.toggleWrap}>
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          style={[styles.toggleButton, sharing && styles.toggleButtonActive]}
          onPress={() => (sharing ? stopSharing() : startSharing())}
        >
          <Ionicons name={sharing ? 'location' : 'location-outline'} size={18} color={sharing ? '#fff' : '#1F8A70'} />
          <Text style={[styles.toggleText, sharing && styles.toggleTextActive]}>
            {sharing ? 'Sharing location' : 'Share my location'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  callout: { minWidth: 160, padding: 4 },
  calloutName: { fontWeight: '700', fontSize: 14 },
  calloutStore: { fontSize: 12, color: '#555', marginTop: 2 },
  calloutAction: { fontSize: 12, color: '#1F8A70', marginTop: 6, fontWeight: '600' },
  toggleWrap: { position: 'absolute', bottom: 24, left: 16, right: 16, alignItems: 'center' },
  error: {
    backgroundColor: '#fff3f3',
    color: '#c0392b',
    padding: 8,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1F8A70',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  toggleButtonActive: { backgroundColor: '#1F8A70' },
  toggleText: { color: '#1F8A70', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
});
