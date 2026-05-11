/**
 * WhatsApp confirmation via Twilio REST API (no SDK needed).
 * Uses fire-and-forget — never blocks the main purchase flow.
 */

/**
 * Normalize a Mexican phone number to E.164 format (+52XXXXXXXXXX).
 *
 * Handles common inputs:
 *   "5523138175"       → +525523138175  (10-digit MX mobile)
 *   "525523138175"     → +525523138175  (12-digit with country code)
 *   "+525523138175"    → +525523138175  (already E.164)
 *   "+5215523138175"   → +525523138175  (legacy MX intl format with extra '1')
 *   "55 2313 8175"     → +525523138175  (spaces)
 */
function normalizePhone(raw) {
  if (!raw) return null;

  // Remove spaces, dashes, parentheses — keep digits and leading +
  const stripped = String(raw).replace(/[\s\-().]/g, '');
  const digits   = stripped.replace(/[^\d]/g, '');
  const hasPlus  = stripped.startsWith('+');

  let e164 = hasPlus ? `+${digits}` : digits;

  // Already has + — validate/fix
  if (e164.startsWith('+')) {
    // Mexico legacy: +521XXXXXXXXXX (13 digits after +) → +52XXXXXXXXXX
    if (/^\+521\d{10}$/.test(e164)) {
      e164 = `+52${e164.slice(4)}`; // remove the '1' after +52
    }
    return e164;
  }

  // No + — infer country code from digit count
  if (digits.length === 10) return `+52${digits}`;                          // MX 10-digit
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`; // 52XXXXXXXXXX
  if (digits.length === 13 && digits.startsWith('521')) {
    return `+52${digits.slice(3)}`; // 521XXXXXXXXXX → +52XXXXXXXXXX
  }

  return `+${digits}`; // best-effort
}

/**
 * Build the WhatsApp message body.
 */
function buildMessage({ buyerName, watchName, numbers, totalMxn }) {
  const nums = numbers
    .map(n => String(n).padStart(2, '0'))
    .join(', ');

  const totalStr = totalMxn ? `$${Number(totalMxn).toLocaleString('es-MX')} MXN` : '';

  return [
    `¡Hola ${buyerName}! 🎉`,
    '',
    `Gracias por tu compra en *Mazal Time*.`,
    '',
    `🕐 *Reloj:* ${watchName}`,
    `🎟️ *Tus números:* ${nums}`,
    totalStr ? `💰 *Total pagado:* ${totalStr}` : '',
    '',
    '¡Mucha suerte en el sorteo! 🍀',
  ].filter(line => line !== null && line !== undefined && !(line === '' && false))
   .join('\n');
}

/**
 * Send a WhatsApp message via Twilio REST API.
 * Returns { ok: true } or { ok: false, error: string }.
 * Never throws — always safe to call without try/catch.
 */
export async function sendWhatsAppConfirmation({ buyerName, buyerPhone, watchName, numbers, totalMxn }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[WhatsApp] Twilio env vars not configured — skipping.');
    return { ok: false, error: 'not_configured' };
  }

  const toPhone = normalizePhone(buyerPhone);
  if (!toPhone) {
    console.warn('[WhatsApp] Invalid phone number:', buyerPhone);
    return { ok: false, error: 'invalid_phone' };
  }

  const body = buildMessage({ buyerName, watchName, numbers, totalMxn });

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams({
      From: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
      To:   `whatsapp:${toPhone}`,
      Body: body,
    });

    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[WhatsApp] Twilio error:', res.status, err);
      return { ok: false, error: err };
    }

    const result = await res.json();
    console.log('[WhatsApp] Sent OK — SID:', result.sid, '→', toPhone);
    return { ok: true, sid: result.sid };
  } catch (err) {
    console.error('[WhatsApp] Network error:', err.message);
    return { ok: false, error: err.message };
  }
}
