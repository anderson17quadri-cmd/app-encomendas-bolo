import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export async function photoToBase64(uri: string): Promise<string | null> {
  try {
    // Se já é uma URL do Supabase, retorna como está
    if (uri.startsWith('http')) return uri;

    const fileName = `cake_${Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Converte base64 para ArrayBuffer
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', JSON.stringify(error));
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    console.log('Photo uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (e) {
    console.error('photoStorage error:', e);
    return null;
  }
}
