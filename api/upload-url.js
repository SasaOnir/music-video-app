import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename richiesto' });

  const ext = filename.split('.').pop() || 'mp3';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `uploads/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from('audio')
    .createSignedUploadUrl(storagePath);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({
    storagePath,
    signedUrl: data.signedUrl
  });
}
