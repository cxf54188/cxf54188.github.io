import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = '/tmp/artdrop';
const META_FILE = '/tmp/artdrop_meta.json';

// Vercel 的 /tmp 是无状态的，函数实例间不共享文件。
// 单实例内多次调用可命中，跨实例会丢。因此这是"演示/小流量"方案。
// 生产建议接对象存储（见 README 中的替换说明）。
async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}
async function loadMeta() {
  try { return JSON.parse(await readFile(META_FILE, 'utf8')); }
  catch { return []; }
}
async function saveMeta(files) {
  await writeFile(META_FILE, JSON.stringify(files, null, 2));
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }

  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const LIMIT = 4.5 * 1024 * 1024; // Vercel hobby 单请求体上限约 4.5MB
  if (contentLength > LIMIT) {
    res.status(413).json({
      error: 'too_large',
      message: `文件 ${Math.round(contentLength/1024/1024)}MB 超过 Vercel 免费版 4.5MB 限制，请改用带对象存储的版本（见 README）`
    });
    return;
  }

  await ensureDir();
  const files = await loadMeta();

  // 用 Web 标准 Request 解析（Vercel 会将 req 适配为 Next 风格，这里直接读 buffer）
  const buf = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const ctype = req.headers['content-type'] || '';
  const boundary = ctype.match(/boundary="?([^";]+)"?/i);
  if (!boundary) { res.status(400).json({ error: 'no boundary' }); return; }
  const sep = Buffer.from('\r\n--' + boundary[1]);
  const tail = Buffer.from('\r\n--' + boundary[1] + '--\r\n');

  let cursor = buf.indexOf(sep) + sep.length + 2;
  const end = buf.indexOf(tail);

  // 只取第一个文件（多文件需循环，此处简化为单个）
  const headEnd = buf.indexOf(Buffer.from('\r\n\r\n'), cursor);
  const head = buf.slice(cursor, headEnd).toString('utf8');
  const disp = head.match(/filename="([^"]*)"/);
  const mime = (head.match(/Content-Type:\s*([^\r\n]+)/i) || [])[1] || '';
  const filename = (disp && disp[1]) || 'upload.bin';
  const bodyStart = headEnd + 4;
  const bodyEnd = buf.indexOf(sep, bodyStart);
  const body = buf.slice(bodyStart, bodyEnd);

  const id = randomUUID();
  const ext = path.extname(filename);
  const stored = id + ext;
  await writeFile(path.join(DATA_DIR, stored), body);

  const senderMatch = head.match(/name="sender"/i);
  let sender = '';
  if (senderMatch) {
    const sv = buf.slice(bodyEnd + sep.length + 2, buf.indexOf(Buffer.from('\r\n'), bodyEnd + sep.length + 2)).toString('utf8').trim();
    sender = sv.slice(0, 20);
  }

  files.push({ id, name: filename, stored, size: body.length, type: mime, sender, time: Date.now() });
  await saveMeta(files);

  res.status(200).json({ ok: true, id, name: filename, size: body.length });
}
