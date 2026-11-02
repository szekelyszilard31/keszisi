import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const lastPos = useRef(null);

  // Canvas méretezése
  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Mentjük a tartalmat
      const imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      canvas.width  = rect.width  * dpr;
      canvas.height = 180 * dpr;
      canvas.style.width  = rect.width + 'px';
      canvas.style.height = '180px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap   = 'round';
      ctx.lineJoin  = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1a1a2e';
      ctx.putImageData(imgData, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left),
        y: (e.touches[0].clientY - rect.top),
      };
    }
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top),
    };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    setDrawing(true);
  }, []);

  const draw = useCallback((e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1a1a2e';
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
  }, [drawing]);

  const stopDraw = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    // Értesítjük a szülőt
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    if (onChange) onChange(dataUrl);
  }, [drawing, onChange]);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    if (onChange) onChange(null);
  };

  return (
    <div>
      <div style={{
        position: 'relative',
        border: '2px solid var(--c-border)',
        borderRadius: 'var(--radius)',
        background: '#ffffff',
        cursor: 'crosshair',
        overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          style={{ display: 'block', touchAction: 'none' }}
        />
        {isEmpty && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
              ✍️ Kérjük írja ide az aláírását
            </span>
          </div>
        )}
        {/* Aláírás vonal */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '24px', right: '24px',
          borderBottom: '1px solid #cbd5e0', pointerEvents: 'none',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--c-grey2)' }}>
          {isEmpty ? 'Az aláírás kötelező a folytatáshoz.' : '✓ Aláírás rögzítve'}
        </span>
        <button type="button" className="btn btn--ghost"
          style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem' }}
          onClick={clear}>
          Törlés
        </button>
      </div>
    </div>
  );
}
