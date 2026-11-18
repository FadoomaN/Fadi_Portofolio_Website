'use client';

import { useRef, useState, type ChangeEvent, type PointerEvent } from 'react';

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

type Props = {
  src: string;
  x: number;
  y: number;
  alt?: string;
  label?: string;
  aspectRatio?: string;
  onChange: (x: number, y: number) => void;
  onUpload?: (file: File) => void | Promise<void>;
  onRemove?: () => void;
  onAltChange?: (alt: string) => void;
};

export default function MediaPositionEditor({ src, x, y, alt = '', label = 'MEDIA POSITION', aspectRatio = '16 / 9', onChange, onUpload, onRemove, onAltChange }: Props) {
  const pointer = useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointer.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onChange(clamp(pointer.current.x - (event.clientX - pointer.current.clientX) / rect.width * 100), clamp(pointer.current.y - (event.clientY - pointer.current.clientY) / rect.height * 100));
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUpload) return;
    setBusy(true);
    try { await onUpload(file); } finally { setBusy(false); }
  };
  return <div className="media-position-editor">
    <div className="media-position-heading"><span>{label}</span>{src && <small>{x}% / {y}%</small>}</div>
    {src ? <div className="media-position-preview" style={{ aspectRatio }} onPointerDown={(event) => { pointer.current = { clientX: event.clientX, clientY: event.clientY, x, y }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={move} onPointerUp={() => { pointer.current = null; }} onPointerCancel={() => { pointer.current = null; }} aria-label="Image preview. Drag to adjust focal position.">
      <img src={src} alt={alt} style={{ objectPosition: `${x}% ${y}%` }} draggable={false} /><span>DRAG TO ADJUST</span>
    </div> : <div className="media-position-empty" style={{ aspectRatio }}>NO IMAGE SELECTED</div>}
    <div className="media-position-actions">
      {onUpload && <label className="admin-upload-button">{busy ? 'UPLOADING…' : src ? 'REPLACE IMAGE' : 'UPLOAD IMAGE'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={upload} /></label>}
      {src && onRemove && <button type="button" onClick={onRemove}>REMOVE</button>}
    </div>
    {src && <div className="media-position-sliders"><label>Horizontal <input type="range" min="0" max="100" value={x} onChange={(event) => onChange(Number(event.target.value), y)} /></label><label>Vertical <input type="range" min="0" max="100" value={y} onChange={(event) => onChange(x, Number(event.target.value))} /></label></div>}
    {onAltChange && <label className="media-position-alt">Alt text<input value={alt} maxLength={240} onChange={(event) => onAltChange(event.target.value)} /></label>}
  </div>;
}
