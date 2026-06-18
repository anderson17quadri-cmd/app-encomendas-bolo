import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export async function photoToBase64(uri: string): Promise<string | null> {
  try {
    if (uri.startsWith('http')) return uri;

    const fileName = `cake_${Date.now()}.jpg`;

    // Usa fetch para ler o ficheiro como blob — funciona no React Native
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, {
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

    return urlData.publicUrl;
  } catch (e) {
    console.error('photoStorage error:', e);
    return null;
  }
}
