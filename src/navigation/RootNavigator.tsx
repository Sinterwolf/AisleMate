import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { FriendsProvider } from '../contexts/FriendsContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1F8A70" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <FriendsProvider>
          <AppNavigator />
        </FriendsProvider>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
