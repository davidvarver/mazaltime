'use client';
import { useState, useRef } from 'react';
import styles from './ImageUpload.module.css';

export default function ImageUpload({ currentUrl, onUploaded }) {
  const [preview, setPreview] = useState(currentUrl || null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview instantly
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');

      onUploaded(data.url);
    } catch (err) {
      alert(err.message);
      setPreview(currentUrl || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.dropZone}
        onClick={() => inputRef.current?.click()}
        style={preview ? { padding: 0, border: 'none' } : {}}
      >
        {preview ? (
          <img src={preview} alt="Foto del reloj" className={styles.preview} />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>📷</span>
            <span>Haz clic para subir foto del reloj</span>
            <span className={styles.hint}>JPG, PNG, WebP · Máx 5MB</span>
          </div>
        )}
      </div>
      {preview && (
        <button type="button" className={styles.changeBtn} onClick={() => inputRef.current?.click()}>
          {loading ? 'Subiendo...' : '🔄 Cambiar foto'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
