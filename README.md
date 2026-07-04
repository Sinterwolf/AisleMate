# AisleMate

A mobile app for seeing which store or grocery shop your friends are at right
now, so you can call them and ask them to grab something while they're
already there.

Built with Expo (React Native + TypeScript), Firebase (Auth + Firestore), and
the Google Places API for turning GPS coordinates into a store name.

## Features

- Email/password sign up and login
- Add friends by email, accept/decline friend requests
- Share your live location with your friends (toggle on/off any time)
- Friends' current location is matched against nearby stores (Google Places
  Nearby Search) so you see "At Trader Joe's" instead of raw coordinates
- Map view with pins for every friend currently sharing their location
- Friends list view with one-tap call and text buttons — the text button
  pre-fills a "can you grab something for me?" message that mentions their
  current store
- Long-press a friend to remove them; edit your phone number from the
  Profile tab

## Project structure

```
App.tsx                   # Entry point: providers + navigation
app.config.ts             # Expo config (permissions, Maps API key, plugins)
src/
  config/env.ts            # Reads EXPO_PUBLIC_* env vars
  firebase/config.ts        # Firebase app/auth/firestore init
  services/
    auth.ts                 # Sign up / sign in / sign out
    friends.ts               # Friend requests, friends list, unfriend
    location.ts              # Location permission + watch + publish
    places.ts                 # GPS -> nearest store name (Google Places)
    calls.ts                   # tel: dialer integration
  contexts/                 # AuthContext, FriendsContext, LocationContext
  navigation/                # Auth stack, bottom tabs, friends stack
  screens/                    # Login, SignUp, Map, Friends, AddFriend, Profile
  components/                  # Avatar, FriendListItem
firestore.rules             # Security rules: locations only visible to accepted friends
firestore.indexes.json      # Composite index for the friendships query
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a project.
2. Add a Web app (yes, even though this is a mobile app — the Firebase JS SDK
   uses the Web app config) and copy the config values.
3. Enable **Authentication > Sign-in method > Email/Password**.
4. Enable **Firestore Database** (start in production mode; the rules in this
   repo lock it down correctly).
5. Deploy the rules and indexes in this repo with the [Firebase CLI](https://firebase.google.com/docs/cli):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add        # select your project
   firebase deploy --only firestore
   ```

### 3. Get a Google Places/Maps API key

1. In the [Google Cloud Console](https://console.cloud.google.com/) (same or
   a different project — needs billing enabled, there's a free monthly credit),
   enable: **Places API**, **Maps SDK for Android**, **Maps SDK for iOS**.
2. Create an API key and restrict it to those APIs.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in the Firebase values from step 2 and the API key from step 3 in `.env`.

### 5. Run the app

react-native-maps is a native module, so it isn't included in the plain Expo
Go app — you need a development build:

```bash
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios       # or: npx expo run:android
```

Alternatively, use [EAS Build](https://docs.expo.dev/develop/development-builds/introduction/)
to build a dev client without a local Xcode/Android Studio setup:

```bash
npx eas build --profile development --platform ios
```

Once a dev build is installed on your device/simulator, `npx expo start` will
connect to it the same way Expo Go normally does.

## Notes / next steps

- Location is only tracked in the foreground; background tracking isn't wired
  up (would need `isAndroidBackgroundLocationEnabled` in `app.config.ts` and
  additional OS-level permission prompts).
- Friend search is by exact email match; there's no username system or
  contact-list import yet.
- Calling and texting use the native `tel:`/`sms:` links, so they open the
  device's own dialer/messaging app — there's no in-app VoIP or chat.
