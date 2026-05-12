'use client';
import { useState } from 'react';
import { getTicketUnitPrice } from '@/lib/pricing';
import styles from './CheckoutModal.module.css';

export default function CheckoutModal({ selectedNumbers, raffle, session, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const count = selectedNumbers.length;
  if (count === 0) return null;

  const originalTotal = count * getTicketUnitPrice(raffle, count);
  const total = couponResult?.discountedTotal ?? originalTotal;

  const handleApplyCoupon = async () => {
    setIsCheckingCoupon(true);
    setCouponMessage('');
    setCouponResult(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          raffleId: raffle.id,
          ticketCount: count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cupón inválido');

      setCouponResult(data);
      setCouponCode(data.coupon.code);
      setCouponMessage(`Cupón aplicado: ${data.coupon.discountPercent}% de descuento.`);
    } catch (error) {
      setCouponMessage(error.message);
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit(formData, selectedNumbers, couponResult?.coupon?.code || '');
    setIsLoading(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} glass`}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <h2>Completar compra</h2>
        <p className={styles.subtitle}>
          Estás comprando <strong>{count}</strong> {count === 1 ? 'número' : 'números'}:
          <span className={styles.numbersList}> {selectedNumbers.map(n => n.toString().padStart(2, '0')).join(', ')}</span>
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!session && (
            <>
              <div className={styles.formGroup}>
                <label>Nombre completo</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Juan Pérez" />
              </div>
              <div className={styles.formGroup}>
                <label>Correo electrónico</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="tu@correo.com" />
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono (WhatsApp)</label>
                <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="10 dígitos" />
              </div>
            </>
          )}

          <div className={styles.couponBox}>
            <label>Cupón de descuento</label>
            <div className={styles.couponRow}>
              <input
                type="text"
                value={couponCode}
                onChange={e => {
                  setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                  setCouponResult(null);
                  setCouponMessage('');
                }}
                placeholder="Ej. MAZAL10"
              />
              <button type="button" onClick={handleApplyCoupon} disabled={isCheckingCoupon || !couponCode.trim()}>
                {isCheckingCoupon ? 'Revisando...' : 'Aplicar'}
              </button>
            </div>
            {couponMessage && (
              <p className={couponResult ? styles.couponSuccess : styles.couponError}>{couponMessage}</p>
            )}
          </div>

          <div className={styles.summary}>
            <span>Total a pagar:</span>
            <span className={styles.total}>
              {couponResult && <small>${originalTotal.toLocaleString('es-MX')} MXN</small>}
              ${total.toLocaleString('es-MX')} MXN
            </span>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Pagar con tarjeta'}
          </button>
        </form>
      </div>
    </div>
  );
}
