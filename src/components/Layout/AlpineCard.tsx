import { useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

interface AlpineCardProps {
  children: React.ReactNode;
  padding?: number | string;
  tilt?: boolean;
  delay?: number;
  glow?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const springConfig = { stiffness: 170, damping: 18 };

export default function AlpineCard({
  children,
  padding = 24,
  tilt = false,
  delay = 0,
  glow,
  onClick,
  style,
  className,
}: AlpineCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [14, -14]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-14, 14]), springConfig);
  const scale = useSpring(1, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tilt || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [tilt, mouseX, mouseY],
  );

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if (tilt) scale.set(1.012);
  }, [tilt, scale]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if (tilt) {
      mouseX.set(0.5);
      mouseY.set(0.5);
      scale.set(1);
    }
  }, [tilt, mouseX, mouseY, scale]);

  const tiltStyle = tilt
    ? { perspective: 1800, transformStyle: 'preserve-3d' as const }
    : {};

  const motionProps = tilt
    ? { style: { rotateX, rotateY, scale, ...tiltStyle } }
    : {};

  return (
    <motion.div
      ref={cardRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.25, 0.46, 0.45, 0.94] }}
      {...motionProps}
      style={{
        position: 'relative',
        borderRadius: 30,
        border: '1px solid rgba(255,255,255,.55)',
        background: 'rgba(255,255,255,.34)',
        backdropFilter: 'blur(28px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
        boxShadow: [
          '0 30px 120px -45px rgba(15,23,42,.26)',
          '0 10px 30px -18px rgba(255,255,255,.82)',
          'inset 0 1px 0 rgba(255,255,255,.92)',
          glow && hovered ? `0 0 40px ${glow}` : '',
        ]
          .filter(Boolean)
          .join(', '),
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...tiltStyle,
        ...(motionProps.style || {}),
        ...style,
      }}
    >
      {/* Layer 1: Diagonal sheen gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 30,
          background:
            'linear-gradient(135deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.04) 40%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 2: Radial highlight orbs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 30,
          background: [
            'radial-gradient(ellipse 50% 40% at 15% 10%, rgba(255,255,255,.14), transparent)',
            'radial-gradient(ellipse 35% 30% at 85% 8%, rgba(255,255,255,.06), transparent)',
            'radial-gradient(ellipse 50% 35% at 50% 95%, rgba(120,113,108,.08), transparent)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />

      {/* Layer 3: Top edge highlight line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '2rem',
          right: '2rem',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,.5) 30%, rgba(255,255,255,.7) 50%, rgba(255,255,255,.5) 70%, transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 4: Top-right orb glow */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -10,
          width: 120,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.60)',
          filter: 'blur(48px)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 5: Bottom-left orb glow */}
      <div
        style={{
          position: 'absolute',
          bottom: -16,
          left: -8,
          width: 110,
          height: 90,
          borderRadius: '50%',
          background: 'rgba(120,113,108,.40)',
          filter: 'blur(44px)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 6: Inner border */}
      <div
        style={{
          position: 'absolute',
          inset: 1,
          borderRadius: 29,
          border: '1px solid rgba(255,255,255,.20)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 7: Grain noise texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 30,
          backgroundImage: GRAIN_SVG,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          opacity: 0.022,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding }}>
        {children}
      </div>
    </motion.div>
  );
}
