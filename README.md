# AisleMate

A mobile app for seeing which store or grocery shop your friends are at right
now, so you can call them and ask them to grab something while they're
already there.

Built with Expo (React Native + TypeScript), Supabase (Auth + Postgres +
Realtime), and the Google Places API for turning GPS coordinates into a
store name.

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
  supabase/config.ts        # Supabase client init (auth + Postgres + realtime)
  services/
    auth.ts                 # Sign up / sign in / sign out
    friends.ts               # Friend requests, friends list, unfriend
    location.ts              # Location permission + watch + publish
    places.ts                 # GPS -> nearest store name (Google Places)
    calls.ts                   # tel:/sms: integration
  contexts/                 # AuthContext, FriendsContext, LocationContext
  navigation/                # Auth stack, bottom tabs, friends stack
  screens/                    # Login, SignUp, Map, Friends, AddFriend, Profile
  components/                  # Avatar, FriendListItem
supabase/schema.sql          # Tables + RLS policies: locations only visible to accepted friends
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/), sign up (free, no credit card
   required for the free tier), and create a new project.
2. In the SQL editor, paste and run the contents of `supabase/schema.sql` from
   this repo. It creates the `profiles`, `friendships`, and `locations`
   tables, the row-level security policies that keep a location visible only
   to its owner and accepted friends, and turns on Realtime for all three
   tables.
3. Under **Authentication > Providers > Email**, turn **off** "Confirm email"
   (unless you want to wire up email confirmation links) so sign-up logs
   people in immediately.
4. Under **Project Settings > API**, copy the **Project URL** and the
   **anon public** key.

### 3. Get a Google Places/Maps API key

1. In the [Google Cloud Console](https://console.cloud.google.com/) (needs
   billing enabled, there's a free monthly credit), enable: **Places API**,
   **Maps SDK for Android**, **Maps SDK for iOS**.
2. Create an API key and restrict it to those APIs.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in the Supabase URL/anon key from step 2 and the API key from step 3 in `.env`.

### 5. Run the app

react-native-maps is a native module, so it isn't included in the plain Expo
Go app. There are two ways to get a real build:

**No local Xcode/Android Studio/Linux toolchain (recommended if you're on a
Chromebook or similar):** use [EAS Build](https://expo.dev/eas), Expo's cloud
build service — it compiles the app on Expo's servers and hands you back a
download link.

```bash
npm install -g eas-cli
eas login                       # or set EXPO_TOKEN for non-interactive auth
eas build:configure             # links this repo to an Expo project
eas build --platform android --profile preview
```

`profile preview` (see `eas.json`) produces a standalone installable `.apk`
with your JS bundle baked in — no Metro server needs to keep running, and
nothing else needs to be installed locally. When the build finishes you get a
QR code / download link: open it on the target device (a phone, or the
Chromebook itself if it has Android app / Play Store support enabled) and
install it directly.

**With a local dev machine (Mac for iOS, Mac/Linux/Windows for Android):**

```bash
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios       # or: npx expo run:android
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
