import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadMeta } from '../_meta.js';

export default async function handler(req, res) {
  const { id } = req.query;
  const files = await loadMeta();
  const meta = files.find(f => f.id === id);
  if (!meta) { res.status(404).json({ error: 'not found' }); return; }

  try {
    const buf = await readFile(path.join('/tmp/artdrop', meta.stored));
    const ext = path.extname(meta.name).toLowerCase();
    const mimeMap = { '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp' };
    const mime = mimeMap[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(meta.name)}`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).end(buf);
  } catch {
    res.status(404).json({ error: 'missing' });
  }
}
