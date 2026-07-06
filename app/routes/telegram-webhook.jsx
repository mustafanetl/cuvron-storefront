import {data} from 'react-router';

function json(status, payload, extraHeaders = {}) {
  return data(payload, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
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
}

/**
 * @param {Route.ActionArgs}
 */
export async function action({request}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return json(500, {ok: false, error: 'Missing TELEGRAM_BOT_TOKEN'});
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const incomingSecret = request.headers.get('x-telegram-bot-api-secret-token');
  if (expectedSecret && incomingSecret !== expectedSecret) {
    return json(401, {ok: false, error: 'Invalid webhook secret'});
  }

  let update;
  try {
    update = await request.json();
  } catch (error) {
    return json(400, {ok: false, error: 'Invalid JSON payload'});
  }

  const message = update?.message || update?.edited_message || update?.channel_post || update?.callback_query?.message;
  const chatId = message?.chat?.id;
  const text = update?.message?.text || update?.callback_query?.data || '';

  if (!chatId) {
    return json(200, {ok: true, ignored: true});
  }

  try {
    await postTelegramMessage(botToken, chatId, getWebhookReplyText(text));
    return json(200, {ok: true});
  } catch (error) {
    console.error(error);
    return json(502, {ok: false, error: 'Failed to send Telegram response'});
  }
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader() {
  return json(
    405,
    {ok: false, error: 'Method not allowed'},
    {
      allow: 'POST',
    },
  );
}

/** @typedef {import('./+types/telegram-webhook').Route} Route */
