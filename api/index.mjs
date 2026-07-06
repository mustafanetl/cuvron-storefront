import app from '../dist/server/index.js';

export default async function handler(req, res) {
  try {
    const url = `https://${req.headers.host}${req.url}`;
    const init = {
      method: req.method,
      headers: req.headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req;
      init.duplex = 'half';
    }

    const request = new Request(url, init);
    const response = await app.fetch(request, {...process.env}, {waitUntil() {}});

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.arrayBuffer();
    res.end(Buffer.from(body));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end('Internal server error');
  }
}
