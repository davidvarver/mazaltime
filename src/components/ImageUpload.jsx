'use client';
import { useState, useRef } from 'react';
import styles from './ImageUpload.module.css';

function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export default function ImageUpload({
  currentUrl,
  onUploaded,
  acceptVideo = false,
  label = 'Haz clic para subir foto del reloj',
  hint = 'Recomendado: 1200 x 1600 px · JPG, PNG, WebP · Máx 5MB',
}) {
  const [preview, setPreview] = useState(currentUrl || null);
  const [previewType, setPreviewType] = useState(isVideoUrl(currentUrl) ? 'video' : 'image');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreviewType(file.type.startsWith('video/') ? 'video' : 'image');
    setPreview(localUrl);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al subir el archivo');

      onUploaded(data.url);
    } catch (err) {
      alert(err.message);
      setPreviewType(isVideoUrl(currentUrl) ? 'video' : 'image');
      setPreview(currentUrl || null);
    } finally {
      setLoading(false);
      e.target.value = '';
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
          previewType === 'video' ? (
            <video src={preview} className={styles.preview} controls muted playsInline />
          ) : (
            <img src={preview} alt="Foto del reloj" className={styles.preview} />
          )
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>{acceptVideo ? 'Foto / video' : 'Foto'}</span>
            <span>{label}</span>
            <span className={styles.hint}>{hint}</span>
          </div>
        )}
      </div>
      {preview && (
        <button type="button" className={styles.changeBtn} onClick={() => inputRef.current?.click()}>
          {loading ? 'Subiendo...' : 'Cambiar archivo'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={acceptVideo ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp'}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
