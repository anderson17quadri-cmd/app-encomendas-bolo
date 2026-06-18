import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

function getSupabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL ??
    Constants.expoConfig?.extra?.supabaseUrl ?? '';
}

function getSupabaseKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    Constants.expoConfig?.extra?.supabaseAnonKey ?? '';
}

export async function photoToBase64(uri: string): Promise<string | null> {
  try {
    if (uri.startsWith('http')) return uri;

    const fileName = `cake_${Date.now()}.jpg`;
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();
    const uploadUrl = `${supabaseUrl}/storage/v1/object/Photos/${fileName}`;

    const result = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
      },
    });

    if (result.status !== 200 && result.status !== 201) {
      console.error('Upload failed:', result.status, result.body);
      return null;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/Photos/${fileName}`;
    return publicUrl;
  } catch (e) {
    console.error('photoStorage error:', e);
    return null;
  }
}
