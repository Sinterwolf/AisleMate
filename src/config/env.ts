function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(
      `[AisleMate] Missing environment variable ${name}. Add it to your .env file (see .env.example).`
    );
  }
  return value ?? '';
}

export const supabaseUrl = readEnv('EXPO_PUBLIC_SUPABASE_URL');
export const supabaseAnonKey = readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

export const googlePlacesApiKey = readEnv('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY');
