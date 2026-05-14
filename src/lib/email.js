function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://mazaltime.com.mx';
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || 'Mazal Time <no-reply@mazaltime.com.mx>';
}

function money(value) {
  return `$${Number(value || 0).toLocaleString('es-MX')} MXN`;
}

function formatNumbers(numbers = []) {
  return numbers.map(number => String(number).padStart(2, '0')).join(', ');
}

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY no configurado. No se envió:', subject);
    return { skipped: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  return sendEmail({
    to,
    subject: 'Recupera tu contraseña de Mazal Time',
    text: `Hola ${name || ''}. Usa este enlace para cambiar tu contraseña: ${resetUrl}. El enlace vence en 1 hora.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#172632;line-height:1.6">
        <h1 style="margin:0 0 12px;color:#172632">Recupera tu contraseña</h1>
        <p>Hola ${name || ''}, recibimos una solicitud para cambiar la contraseña de tu cuenta en Mazal Time.</p>
        <p>Este enlace vence en 1 hora:</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#d4af37;color:#0c2d3f;padding:12px 20px;border-radius:999px;font-weight:700;text-decoration:none">Cambiar contraseña</a></p>
        <p>Si tú no pediste este cambio, puedes ignorar este correo.</p>
      </div>
    `,
  });
}

export async function sendPurchaseConfirmationEmail({ to, buyerName, watchName, numbers, totalMxn, couponCode }) {
  const appUrl = getAppUrl();

  return sendEmail({
    to,
    subject: 'Confirmación de boletos Mazal Time',
    text: `Hola ${buyerName || ''}. Tu compra está confirmada para ${watchName}. Números: ${formatNumbers(numbers)}. Total: ${money(totalMxn)}.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#172632;line-height:1.6">
        <h1 style="margin:0 0 12px;color:#172632">Tus boletos están confirmados</h1>
        <p>Hola ${buyerName || ''}, tu compra en Mazal Time quedó confirmada.</p>
        <div style="border:1px solid #efe1c8;border-radius:18px;padding:18px;background:#fffcf5">
          <p><strong>Rifa:</strong> ${watchName}</p>
          <p><strong>Números:</strong> ${formatNumbers(numbers)}</p>
          <p><strong>Total pagado:</strong> ${money(totalMxn)}</p>
          ${couponCode ? `<p><strong>Cupón:</strong> ${couponCode}</p>` : ''}
        </div>
        <p>Puedes revisar tus boletos aquí:</p>
        <p><a href="${appUrl}/mis-boletos" style="display:inline-block;background:#0c2d3f;color:#fff;padding:12px 20px;border-radius:999px;font-weight:700;text-decoration:none">Ver mis boletos</a></p>
      </div>
    `,
  });
}
