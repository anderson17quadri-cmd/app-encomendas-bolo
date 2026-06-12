import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export async function photoToBase64(uri: string): Promise<string | null> {
  try {
    const fileName = `cake_${Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, byteArray, { contentType: 'image/jpeg', upsert: false });
    if (error) { console.error('Upload error:', error); return null; }
    const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.error('photoStorage error:', e);
    return null;
  }
}
