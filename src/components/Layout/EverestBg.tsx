import { useMemo } from 'react';

interface Particle {
  left: string;
  top: string;
  width: number;
  height: number;
  opacity: number;
  blur: number;
  duration: number;
  delay: number;
}

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const seed = ((i * 7 + 13) % 100) / 100;
    const seed2 = ((i * 11 + 3) % 100) / 100;
    const seed3 = ((i * 17 + 7) % 100) / 100;
    particles.push({
      left: `${seed * 100}%`,
      top: `${40 + seed2 * 55}%`,
      width: 80 + seed3 * 160,
      height: 30 + seed * 50,
      opacity: 0.04 + seed2 * 0.04,
      blur: 40 + seed3 * 20,
      duration: 20 + seed * 10,
      delay: seed2 * -30,
    });
  }
  return particles;
}

const KEYFRAMES = `
@keyframes everest-float {
  0% { transform: translateY(0) translateX(0); opacity: var(--p-opacity); }
  25% { transform: translateY(-30px) translateX(10px); opacity: calc(var(--p-opacity) * 1.2); }
  50% { transform: translateY(-50px) translateX(-8px); opacity: var(--p-opacity); }
  75% { transform: translateY(-25px) translateX(12px); opacity: calc(var(--p-opacity) * 0.8); }
  100% { transform: translateY(0) translateX(0); opacity: var(--p-opacity); }
}
`;

export default function EverestBg() {
  const particles = useMemo(() => generateParticles(18), []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* Mountain silhouettes via clip-path */}
      {/* Far range */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '55%',
          background: 'rgba(15,23,42,.025)',
          clipPath:
            'polygon(0% 100%, 0% 65%, 8% 50%, 18% 58%, 28% 35%, 38% 48%, 48% 25%, 55% 38%, 65% 20%, 72% 32%, 80% 15%, 88% 35%, 95% 28%, 100% 42%, 100% 100%)',
        }}
      />
      {/* Mid range */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '45%',
          background: 'rgba(15,23,42,.035)',
          clipPath:
            'polygon(0% 100%, 0% 72%, 10% 55%, 22% 65%, 32% 42%, 42% 55%, 52% 35%, 60% 50%, 70% 30%, 78% 45%, 90% 38%, 100% 55%, 100% 100%)',
        }}
      />
      {/* Near range */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '35%',
          background: 'rgba(15,23,42,.045)',
          clipPath:
            'polygon(0% 100%, 0% 60%, 12% 48%, 25% 58%, 38% 40%, 50% 55%, 62% 38%, 75% 52%, 88% 42%, 100% 58%, 100% 100%)',
        }}
      />

      {/* Fog / mist particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.width,
            height: p.height,
            borderRadius: '50%',
            background:
              i % 3 === 0
                ? 'rgba(186,210,235,.5)'
                : 'rgba(255,255,255,.5)',
            filter: `blur(${p.blur}px)`,
            opacity: p.opacity,
            animation: `everest-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            ['--p-opacity' as string]: p.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Dot grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(15,23,42,.5) 0.8px, transparent 0.8px)',
          backgroundSize: '28px 28px',
          opacity: 0.028,
        }}
      />

      {/* Top horizontal light line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,.7) 20%, rgba(255,255,255,.9) 50%, rgba(255,255,255,.7) 80%, transparent)',
        }}
      />

      {/* Bottom fade to --bg */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(to top, #f8f8f6, transparent)',
        }}
      />
    </div>
  );
}
