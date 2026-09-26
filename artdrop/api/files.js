import { loadMeta } from './_meta.js';

export default async function handler(req, res) {
  const files = await loadMeta();
  res.status(200).json({ files });
}
