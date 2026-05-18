import crypto from 'crypto';

const CONEKTA_API_URL = 'https://api.conekta.io';
const CONEKTA_ACCEPT = 'application/vnd.conekta-v2.2.0+json';

function getPrivateKey() {
  return process.env.CONEKTA_PRIVATE_KEY || process.env.CONEKTA_API_KEY || '';
}

export function isConektaConfigured() {
  return Boolean(getPrivateKey());
}

export function createReservationId() {
  return `conekta_${crypto.randomUUID()}`;
}

function normalizePublicKey(publicKey = '') {
  return publicKey.replace(/\\n/g, '\n').trim();
}

export function verifyConektaWebhookSignature(payload, digestHeader) {
  const publicKey = normalizePublicKey(process.env.CONEKTA_WEBHOOK_PUBLIC_KEY || '');

  if (!publicKey) {
    console.warn('[Conekta] CONEKTA_WEBHOOK_PUBLIC_KEY no configurado. Webhook sin verificacion de firma.');
    return true;
  }

  if (!digestHeader) return false;

  const signature = String(digestHeader)
    .replace(/^sha-?256=/i, '')
    .replace(/^rsa-sha-?256=/i, '')
    .trim();

  try {
    return crypto
      .createVerify('RSA-SHA256')
      .update(payload, 'utf8')
      .verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error('[Conekta] Error verificando firma webhook:', error.message);
    return false;
  }
}

export async function createConektaOrder({
  customer,
  raffle,
  numbers,
  unitPrice,
  coupon,
  reservationId,
  appUrl,
  expiresAt,
}) {
  const privateKey = getPrivateKey();

  if (!privateKey) {
    throw new Error('Conekta no esta configurado en el servidor.');
  }

  const paddedNumbers = numbers.map(number => String(number).padStart(2, '0')).join(', ');
  const watchName = raffle.watchName || [raffle.watchBrand, raffle.watchModel].filter(Boolean).join(' ') || raffle.title;
  const couponDescription = coupon ? ` Cupon ${coupon.code}: ${coupon.discountPercent}% de descuento.` : '';

  const body = {
    currency: 'MXN',
    customer_info: {
      name: customer.name || customer.email,
      email: customer.email,
      phone: customer.phone || undefined,
    },
    pre_authorize: false,
    metadata: {
      userId: customer.id,
      raffleId: raffle.id,
      numbers: JSON.stringify(numbers),
      reservationId,
      couponCode: coupon?.code || '',
      discountPercent: coupon?.discountPercent ? String(coupon.discountPercent) : '',
    },
    line_items: [
      {
        name: `Mazal Time - ${watchName}`,
        description: `Boleto(s): ${paddedNumbers}.${couponDescription}`,
        quantity: numbers.length,
        unit_price: unitPrice * 100,
      },
    ],
    shipping_lines: [{ amount: 0 }],
    checkout: {
      allowed_payment_methods: ['card'],
      type: 'HostedPayment',
      name: `Mazal Time - ${watchName}`,
      success_url: `${appUrl}/compra-exitosa?provider=conekta`,
      failure_url: `${appUrl}/api/conekta/cancel?reservation_id=${encodeURIComponent(reservationId)}`,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      redirection_time: 4,
    },
  };

  const response = await fetch(`${CONEKTA_API_URL}/orders`, {
    method: 'POST',
    headers: {
      Accept: CONEKTA_ACCEPT,
      'Accept-Language': 'es',
      Authorization: `Bearer ${privateKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let order;

  try {
    order = responseText ? JSON.parse(responseText) : null;
  } catch {
    order = null;
  }

  if (!response.ok) {
    const details = order?.details?.map(detail => detail.message).join(', ');
    throw new Error(details || order?.message || `Conekta error ${response.status}: ${responseText}`);
  }

  const checkoutUrl = order?.checkout?.url;
  if (!checkoutUrl) {
    throw new Error('Conekta no devolvio una URL de pago.');
  }

  return order;
}
