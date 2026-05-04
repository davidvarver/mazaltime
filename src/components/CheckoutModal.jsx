'use client';
import { useState } from 'react';
import styles from './CheckoutModal.module.css';

export default function CheckoutModal({ selectedNumbers, raffle, session, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const count = selectedNumbers.length;
  if (count === 0) return null;

  const total = count >= 2 ? count * raffle.price2 : count * raffle.price1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit(formData, selectedNumbers);
    setIsLoading(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} glass`}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <h2>Completar Compra</h2>
        <p className={styles.subtitle}>
          Estás comprando <strong>{count}</strong> {count === 1 ? 'número' : 'números'}: 
          <span className={styles.numbersList}> {selectedNumbers.map(n => n.toString().padStart(2, '0')).join(', ')}</span>
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!session && (
            <>
              <div className={styles.formGroup}>
                <label>Nombre Completo</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Juan Pérez" />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="tu@correo.com" />
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono (WhatsApp)</label>
                <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="10 dígitos" />
              </div>
              <div className={styles.formGroup}>
                <label>Crea una Contraseña (Para ver tus boletos luego)</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Contraseña segura" />
              </div>
            </>
          )}
          
          <div className={styles.summary}>
            <span>Total a pagar:</span>
            <span className={styles.total}>${total.toLocaleString()} MXN</span>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Pagar'}
          </button>
        </form>
      </div>
    </div>
  );
}
