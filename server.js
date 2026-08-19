// Satori Daily — minimal zero-dependency static server (with video range streaming)
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(__dirname, p);
  if (!fp.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const type = types[path.extname(fp).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
      let start = parseInt(m[1], 10); let end = m[2] ? parseInt(m[2], 10) : st.size - 1;
      if (isNaN(start)) start = 0;
      if (isNaN(end) || end >= st.size) end = st.size - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${st.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1
      });
      fs.createReadStream(fp, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(fp).pipe(res);
    }
  });
}).listen(port, () => console.log('Satori Daily demo running on port ' + port));
