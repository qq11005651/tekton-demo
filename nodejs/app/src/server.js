const http = require('node:http');

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<h1>nodejs-demo</h1><p>version: ${process.env.APP_VERSION || 'v1'}</p>`);
});

server.listen(port, () => console.log(`listening on ${port}`));
