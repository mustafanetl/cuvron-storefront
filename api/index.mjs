import app from '../dist/server/index.js';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function getWebhookReplyText(text) {
  const trimmed = (text || '').trim();
  if (/^\/start\b/i.test(trimmed)) {
    return 'Welcome to Gordond bot. Send /help to see available commands.';
  }
  if (/^\/help\b/i.test(trimmed)) {
    return 'Available commands:\n/start - start bot\n/help - show this help';
  }
  if (!trimmed) {
    return 'Message received.';
  }
  return `You said: ${trimmed}`;
}

async function postTelegramMessage(botToken, chatId, text) {
  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Telegram sendMessage failed (${response.status}): ${detail}`);
  }

  return response.json();
}

async function handleTelegramWebhook(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    sendJson(res, 405, {ok: false, error: 'Method not allowed'});
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    sendJson(res, 500, {ok: false, error: 'Missing TELEGRAM_BOT_TOKEN'});
    return;
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
  if (expectedSecret && incomingSecret !== expectedSecret) {
    sendJson(res, 401, {ok: false, error: 'Invalid webhook secret'});
    return;
  }

  let update;
  try {
    const rawBody = await readRequestBody(req);
    update = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    sendJson(res, 400, {ok: false, error: 'Invalid JSON payload'});
    return;
  }

  const message = update?.message || update?.edited_message || update?.channel_post || update?.callback_query?.message;
  const chatId = message?.chat?.id;
  const text = update?.message?.text || update?.callback_query?.data || '';

  if (!chatId) {
    sendJson(res, 200, {ok: true, ignored: true});
    return;
  }

  try {
    await postTelegramMessage(botToken, chatId, getWebhookReplyText(text));
    sendJson(res, 200, {ok: true});
  } catch (error) {
    console.error(error);
    sendJson(res, 502, {ok: false, error: 'Failed to send Telegram response'});
  }
}

export default async function handler(req, res) {
  try {
    const url = `https://${req.headers.host}${req.url}`;
    const pathname = new URL(url).pathname;

    if (pathname === '/api/telegram-webhook' || pathname === '/api/telegram/webhook') {
      await handleTelegramWebhook(req, res);
      return;
    }

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
