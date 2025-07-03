import React from 'react';

function ZoomButtons({ centerChart, handTool, setHandTool, zoom, setZoom, pan, setPan, chartRef, positions }) {
  const btnBase =
    'w-9 h-9 flex items-center justify-center rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 shadow-sm';

  const zoomTimeout = React.useRef(null);
  const [zoomDisabled, setZoomDisabled] = React.useState(false);

  const debouncedZoom = (delta) => {
    if (zoomDisabled) return;
    setZoomDisabled(true);
    setZoom(z => {
      let newZoom = +(z + delta).toFixed(3);
      newZoom = Math.max(0.5, Math.min(2.5, newZoom));
      return newZoom;
    });
    clearTimeout(zoomTimeout.current);
    zoomTimeout.current = setTimeout(() => setZoomDisabled(false), 120);
  };

  return (
    <>
      <button
        onClick={() => debouncedZoom(0.1)}
        className={`${btnBase} bg-primary-dark text-white border-primary hover:bg-primary active:scale-95`}
        title="Zoom In"
        aria-label="Zoom In"
        disabled={zoomDisabled}
        style={zoomDisabled ? { opacity: 0.7, pointerEvents: 'none' } : {}}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button
        onClick={() => debouncedZoom(-0.1)}
        className={`${btnBase} bg-primary-dark text-white border-primary hover:bg-primary active:scale-95`}
        title="Zoom Out"
        aria-label="Zoom Out"
        disabled={zoomDisabled}
        style={zoomDisabled ? { opacity: 0.7, pointerEvents: 'none' } : {}}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button
        onClick={centerChart}
        className={`${btnBase} bg-primary-dark text-white border-primary hover:bg-primary active:scale-95`}
        title="Reset"
        aria-label="Reset"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
      </button>
      <button
        onClick={() => setHandTool(!handTool)}
        className={
          handTool
            ? `${btnBase} bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 text-white border-2 border-orange-400 shadow-lg ring-2 ring-orange-300 animate-pulse`
            : `${btnBase} bg-white text-orange-500 border-orange-300 hover:bg-orange-100 active:scale-95`
        }
        title={handTool ? "Disable Hand Tool" : "Enable Hand Tool"}
        aria-label={handTool ? "Disable Hand Tool" : "Enable Hand Tool"}
        style={handTool ? { boxShadow: '0 0 0 4px rgba(251,191,36,0.18), 0 8px 32px 0 rgba(251,191,36,0.12)' } : {}}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
        </svg>
      </button>
    </>
  );
}

export default ZoomButtons; 