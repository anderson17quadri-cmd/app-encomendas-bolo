import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export async function photoToBase64(uri: string): Promise<string | null> {
  try {
    const fileName = `cake_${Date.now()}.jpg`;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.error('photoStorage error:', e);
    return null;
  }
}

function decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
