import { supabase } from '../../../shared/lib/supabase';

export interface UploadedFile {
  name: string;
  url: string;
  path: string;
}

export async function uploadTaskAttachments(
  files: File[],
  taskId: string,
  folder: 'tasks' | 'solutions'
): Promise<UploadedFile[]> {
  const client = supabase;
  if (!client) {
    throw new Error('Supabase не инициализирован');
  }
  if (files.length === 0) return [];

  const uploads = files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${taskId}/${fileName}`;

    console.log(`[uploadTaskAttachments] Uploading to ${filePath}...`);

    const { error } = await client.storage
      .from('task-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error(`[uploadTaskAttachments] Upload error:`, error);
      throw error;
    }

    const { data } = client.storage
      .from('task-attachments')
      .getPublicUrl(filePath);

    console.log(`[uploadTaskAttachments] Uploaded: ${data.publicUrl}`);
    return {
      name: file.name,
      url: data.publicUrl,
      path: filePath,
    };
  });

  return Promise.all(uploads);
}