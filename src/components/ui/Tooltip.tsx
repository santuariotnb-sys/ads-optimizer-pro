import { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export default function Tooltip({ children, text }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ position: 'relative', cursor: 'help' }}
    >
      {children}
      <span
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          background: '#0f172a',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 12,
          maxWidth: 240,
          width: 'max-content',
          lineHeight: 1.4,
          fontWeight: 400,
          letterSpacing: 'normal',
          textTransform: 'none',
          boxShadow: '0 4px 16px rgba(15,23,42,0.3)',
          zIndex: 200,
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.18s ease',
          whiteSpace: 'normal',
        }}
      >
        {text}
        {/* Arrow */}
        <span
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #0f172a',
          }}
        />
      </span>
    </span>
  );
}
