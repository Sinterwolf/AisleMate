import { Alert, Linking } from 'react-native';

export async function callFriend(phoneNumber: string, friendName: string) {
  if (!phoneNumber) {
    Alert.alert('No phone number', `${friendName} hasn't added a phone number yet.`);
    return;
  }

  const url = `tel:${phoneNumber.replace(/[^\d+]/g, '')}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('Unable to call', 'This device cannot place phone calls.');
    return;
  }
  await Linking.openURL(url);
}
