import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { AppTabParamList } from './types';
import FriendsMapScreen from '../screens/FriendsMapScreen';
import FriendsStackNavigator from './FriendsStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import { useFriends } from '../contexts/FriendsContext';

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  const { incomingRequests } = useFriends();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1F8A70' }}>
      <Tab.Screen
        name="Map"
        component={FriendsMapScreen}
        options={{
          headerShown: true,
          title: 'AisleMate',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="FriendsTab"
        component={FriendsStackNavigator}
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
          tabBarBadge: incomingRequests.length > 0 ? incomingRequests.length : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
