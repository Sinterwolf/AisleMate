import { Alert, Linking, Platform } from 'react-native';

function sanitizeNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, '');
}

export async function callFriend(phoneNumber: string, friendName: string) {
  if (!phoneNumber) {
    Alert.alert('No phone number', `${friendName} hasn't added a phone number yet.`);
    return;
  }

  const url = `tel:${sanitizeNumber(phoneNumber)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('Unable to call', 'This device cannot place phone calls.');
    return;
  }
  await Linking.openURL(url);
}

function grabSomethingMessage(friendName: string, storeName: string | null | undefined) {
  return storeName
    ? `Hey ${friendName}! Saw you're at ${storeName} - any chance you could grab something for me while you're there?`
    : `Hey ${friendName}! Any chance you could grab something for me while you're out?`;
}

export async function textFriendToGrabSomething(
  phoneNumber: string,
  friendName: string,
  storeName: string | null | undefined
) {
  if (!phoneNumber) {
    Alert.alert('No phone number', `${friendName} hasn't added a phone number yet.`);
    return;
  }

  const body = encodeURIComponent(grabSomethingMessage(friendName, storeName));
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${sanitizeNumber(phoneNumber)}${separator}body=${body}`;

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('Unable to text', 'This device cannot send text messages.');
    return;
  }
  await Linking.openURL(url);
}
