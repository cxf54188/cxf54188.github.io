import { readFile } from 'node:fs/promises';

export async function loadMeta() {
  try { return JSON.parse(await readFile('/tmp/artdrop_meta.json', 'utf8')); }
  catch { return []; }
}
