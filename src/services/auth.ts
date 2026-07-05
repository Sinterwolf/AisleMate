import { supabase } from '../supabase/config';

export async function signUp(
  displayName: string,
  email: string,
  phoneNumber: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName,
        phone_number: phoneNumber.trim(),
      },
    },
  });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updatePhoneNumber(uid: string, phoneNumber: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ phone_number: phoneNumber.trim() })
    .eq('id', uid);
  if (error) throw error;
}
