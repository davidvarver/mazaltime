export function normalizeCouponCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function isCouponUsable(coupon, now = new Date()) {
  if (!coupon) return false;
  if (!coupon.isActive) return false;
  return new Date(coupon.expiresAt).getTime() >= now.getTime();
}

export function applyCouponToUnitPrice(unitPrice, coupon) {
  const price = Number(unitPrice) || 0;
  const discount = Number(coupon?.discountPercent) || 0;

  if (!price || discount <= 0) return price;

  return Math.max(1, Math.round(price * (100 - discount) / 100));
}

export function getCouponStatus(coupon, now = new Date()) {
  if (!coupon?.isActive) return 'INACTIVE';
  if (new Date(coupon.expiresAt).getTime() < now.getTime()) return 'EXPIRED';
  return 'ACTIVE';
}
