function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(
      `[AisleMate] Missing environment variable ${name}. Add it to your .env file (see .env.example).`
    );
  }
  return value ?? '';
}

export const firebaseConfig = {
  apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

export const googlePlacesApiKey = readEnv('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY');
