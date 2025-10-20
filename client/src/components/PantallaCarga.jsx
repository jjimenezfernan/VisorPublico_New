import { useState, useEffect } from 'react';

// Componente para mostrar dentro del MapContainer
function MapLoadingOverlay({ loading }) {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#374151',
          fontFamily: 'system-ui',
          letterSpacing: '0.5px',
        }}
      >
        Cargando capas{dots}
      </div>
    </div>
  );
}

export default MapLoadingOverlay;