const http = require('http');
const { handler } = require('./github_activity');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const event = {
      httpMethod: req.method,
      headers: req.headers,
      path: req.url,
      rawPath: req.url,
      body,
      isBase64Encoded: false
    };
    const context = {};
    handler(event, context).then(response => {
      const statusCode = response.statusCode || 200;
      const headers = response.headers || {};
      res.writeHead(statusCode, headers);
      res.end(response.body || '');
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err?.message || 'Server error' }));
    });
  });
});

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});


