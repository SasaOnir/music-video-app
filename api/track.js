import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id richiesto' });

  if (req.method === 'GET') {
    const { data: track, error } = await supabase
      .from('tracks')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (error || !track) return res.status(404).json({ error: 'Non trovata' });

    const { data: urlData, error: urlError } = await supabase.storage
      .from('audio')
      .createSignedUrl(track.storage_path, 7200);

    if (urlError) return res.status(500).json({ error: urlError.message });
    return res.status(200).json({ url: urlData.signedUrl });
  }

  if (req.method === 'PUT') {
    const { lyrics } = req.body;
    const { data, error } = await supabase
      .from('tracks')
      .update({ lyrics: lyrics || '' })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { data: track } = await supabase
      .from('tracks')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (track) {
      await supabase.storage
        .from('audio')
        .remove([track.storage_path]);
    }

    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
