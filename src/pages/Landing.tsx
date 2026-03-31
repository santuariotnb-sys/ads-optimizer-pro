import { useState, useEffect, useRef, useCallback, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard, Link2, Sparkles, ArrowRight, Check, X, ChevronDown,
  DollarSign, Target, Eye, TrendingUp, ArrowUpRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(target: number, duration = 1600, trigger: boolean) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!trigger || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * ease * 10) / 10);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, trigger]);
  return value;
}

function useIsMobileLanding() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return m;
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
const FONT_BODY = "'Plus Jakarta Sans', sans-serif";
const FONT_DISPLAY = "'Space Grotesk', sans-serif";
const DARK_BG = '#06080f';
const LIGHT_BG = '#fafbfc';
const ACCENT_FROM = '#2563eb';
const ACCENT_TO = '#7c3aed';

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES (injected once)
   ═══════════════════════════════════════════════════════════ */

function GlobalStyles() {
  return (
    <style>{`
      html { scroll-behavior: smooth; }
      @keyframes float-mockup {
        0%, 100% { transform: perspective(1200px) rotateX(8deg) translateY(0); }
        50% { transform: perspective(1200px) rotateX(8deg) translateY(-8px); }
      }
      @keyframes spin-border {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes orb-drift-1 {
        0%, 100% { transform: translate(0, 0); }
        33% { transform: translate(40px, -30px); }
        66% { transform: translate(-30px, 20px); }
      }
      @keyframes orb-drift-2 {
        0%, 100% { transform: translate(0, 0); }
        33% { transform: translate(-35px, 25px); }
        66% { transform: translate(25px, -35px); }
      }
      @keyframes orb-drift-3 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(15px, -15px) scale(1.1); }
      }
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .landing-page * { box-sizing: border-box; }
      .landing-page a { text-decoration: none; }
    `}</style>
  );
}

/* ═══════════════════════════════════════════════════════════
   REUSABLE PRIMITIVES
   ═══════════════════════════════════════════════════════════ */

function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useInView();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: EASE_PREMIUM }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function CTAButton({ children, outline = false, style, href, large }: {
  children: ReactNode; outline?: boolean; style?: CSSProperties; href?: string; large?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const pad = large ? '18px 48px' : '14px 32px';
  const fs = large ? 17 : 15;

  const handleClick = () => {
    if (href?.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (href) {
      window.open(href, '_blank');
    }
  };

  if (outline) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: pad, borderRadius: 12, fontWeight: 600, fontSize: fs, cursor: 'pointer',
          fontFamily: FONT_BODY, border: '1px solid rgba(255,255,255,0.15)',
          background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
          color: 'rgba(255,255,255,0.8)',
          transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          ...style,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: pad, borderRadius: 12, fontWeight: 600, fontSize: fs, cursor: 'pointer',
        fontFamily: FONT_BODY, border: 'none', color: '#fff',
        background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
        boxShadow: hovered
          ? `0 0 40px rgba(37,99,235,0.4), 0 8px 24px rgba(0,0,0,0.3)`
          : `0 0 20px rgba(37,99,235,0.2), 0 4px 12px rgba(0,0,0,0.2)`,
        transform: hovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function TiltCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [glowing, setGlowing] = useState(false);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`);
    setGlowing(true);
  }, []);

  const handleLeave = useCallback(() => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
    setGlowing(false);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform,
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 32,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: glowing
          ? '0 0 60px rgba(37,99,235,0.1), 0 20px 60px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NAV (fixed, glass on scroll)
   ═══════════════════════════════════════════════════════════ */

function Nav() {
  const isMobile = useIsMobileLanding();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkStyle: CSSProperties = {
    color: 'rgba(255,255,255,0.5)', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', transition: 'color 0.2s',
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 20px' : '0 48px',
      background: scrolled ? 'rgba(6,8,15,0.8)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/logo-everest.png" alt="Ads Everest" style={{ height: 32 }} />
        <span style={{
          fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: '#fff',
          letterSpacing: '-0.02em',
        }}>
          Ads.Everest
        </span>
      </div>

      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a onClick={() => scrollTo('features')} style={linkStyle}>Recursos</a>
          <a onClick={() => scrollTo('pricing')} style={linkStyle}>Precos</a>
          <a onClick={() => scrollTo('faq')} style={linkStyle}>FAQ</a>
        </div>
      )}

      <CTAButton href="#pricing" style={{ padding: '9px 22px', fontSize: 13 }}>
        Comecar
      </CTAButton>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 1: HERO
   ═══════════════════════════════════════════════════════════ */

function HeroSection() {
  const isMobile = useIsMobileLanding();

  return (
    <section id="hero" style={{
      position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: DARK_BG, overflow: 'hidden',
      padding: isMobile ? '100px 20px 60px' : '120px 48px 80px',
    }}>
      {/* Radial glow — primary blue */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 600, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />
      {/* Radial glow — secondary purple */}
      <div style={{
        position: 'absolute', top: '35%', left: '60%', transform: 'translateX(-50%)',
        width: 500, height: 400, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
      {/* Dot grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', maxWidth: 800,
      }}>
        {/* Animated gradient badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_PREMIUM }}
          style={{ marginBottom: 32, position: 'relative' }}
        >
          <div style={{
            position: 'relative', borderRadius: 999, overflow: 'hidden', padding: 1,
          }}>
            {/* Spinning conic gradient border */}
            <div style={{
              position: 'absolute', inset: -20, borderRadius: '50%',
              background: `conic-gradient(from 0deg, ${ACCENT_FROM}, ${ACCENT_TO}, ${ACCENT_FROM})`,
              animation: 'spin-border 3s linear infinite',
            }} />
            <div style={{
              position: 'relative', background: 'rgba(6,8,15,0.9)',
              borderRadius: 999, padding: '8px 20px',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
            }}>
              <Sparkles size={14} color={ACCENT_FROM} />
              Plataforma para gestores de trafego
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_PREMIUM }}
          style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 36 : 64, fontWeight: 700,
            lineHeight: 1.08, margin: '0 0 24px', color: '#fff',
            letterSpacing: '-0.03em', maxWidth: 800,
          }}
        >
          Pare de queimar budget.{'\n'}
          <span style={{
            background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Comece a ver resultados.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE_PREMIUM }}
          style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 16 : 18, fontWeight: 400,
            color: 'rgba(255,255,255,0.5)', maxWidth: 600, margin: '0 0 40px',
            lineHeight: 1.6,
          }}
        >
          Dashboard inteligente, tracking real de vendas, analise de criativos com IA.
          Tudo que voce precisa pra escalar Meta Ads com lucro.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_PREMIUM }}
          style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}
        >
          <CTAButton href="#pricing">
            Comecar agora <ArrowRight size={16} style={{ marginLeft: 6, verticalAlign: 'middle' }} /> R$97/mes
          </CTAButton>
          <CTAButton outline href="#features">
            Ver recursos
          </CTAButton>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}
        >
          7 dias de garantia &middot; Sem fidelidade &middot; Setup em 10 minutos
        </motion.p>
      </div>

      {/* ── MOCKUP ── */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.4, ease: EASE_PREMIUM }}
        style={{
          position: 'relative', width: '100%', maxWidth: 900, marginTop: 60, zIndex: 2,
        }}
      >
        {/* Glow beneath mockup */}
        <div style={{
          position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: 200, borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 70%)`,
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {/* Animated gradient border wrapper */}
        <div style={{
          borderRadius: 22, padding: 2, position: 'relative', overflow: 'hidden',
          animation: 'float-mockup 8s ease-in-out infinite',
        }}>
          {/* Spinning gradient border */}
          <div style={{
            position: 'absolute', inset: -100,
            background: `conic-gradient(from 0deg, ${ACCENT_FROM}, ${ACCENT_TO}, transparent, ${ACCENT_FROM})`,
            animation: 'spin-border 4s linear infinite',
          }} />

          {/* Card body */}
          <div style={{
            position: 'relative', background: '#0c0e1a', borderRadius: 20,
            padding: isMobile ? 20 : 32,
          }}>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'ROAS', val: '4.2x', color: '#4ade80' },
                { label: 'CPA', val: 'R$18', color: '#60a5fa' },
                { label: 'EMQ Score', val: '8.7', color: '#a78bfa' },
                { label: 'Conversoes', val: '247', color: '#f59e0b' },
              ].map(m => (
                <div key={m.label} style={{
                  padding: isMobile ? 12 : 16, borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 20 : 26, fontWeight: 700, color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Sidebar hint + chart area */}
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Sidebar hint (desktop only) */}
              {!isMobile && (
                <div style={{
                  width: 48, borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px 0', gap: 16,
                }}>
                  {[LayoutDashboard, Link2, Sparkles, Target].map((Icon, i) => (
                    <Icon key={i} size={16} color={i === 0 ? ACCENT_FROM : 'rgba(255,255,255,0.15)'} />
                  ))}
                </div>
              )}
              {/* Chart */}
              <div style={{
                flex: 1, height: 120, borderRadius: 14,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                overflow: 'hidden',
              }}>
                <svg viewBox="0 0 800 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 100 C80 85 160 75 240 55 C320 40 400 50 480 35 C560 22 640 28 720 18 L800 12 L800 120 L0 120Z" fill="url(#heroChartFill)" />
                  <path d="M0 100 C80 85 160 75 240 55 C320 40 400 50 480 35 C560 22 640 28 720 18 L800 12" fill="none" stroke="#7c3aed" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom mask — fades mockup into dark bg */}
        <div style={{
          position: 'absolute', bottom: -2, left: 0, right: 0, height: 80,
          background: `linear-gradient(transparent, ${DARK_BG})`,
          pointerEvents: 'none', zIndex: 3,
        }} />
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 2: PROBLEM
   ═══════════════════════════════════════════════════════════ */

function ProblemSection() {
  const isMobile = useIsMobileLanding();
  const questions = [
    { icon: DollarSign, text: 'Qual campanha trouxe mais lucro real esse mes?' },
    { icon: Target, text: 'Qual criativo esta fadigado e precisa ser pausado?' },
    { icon: Eye, text: 'De onde vieram os clientes que compraram ontem?' },
    { icon: TrendingUp, text: 'Quanto do seu orcamento esta sendo desperdicado?' },
  ];

  return (
    <section style={{
      position: 'relative', background: DARK_BG, overflow: 'hidden',
      padding: isMobile ? '80px 20px' : '120px 48px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <Reveal>
          <h2 style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 28 : 44, fontWeight: 700,
            textAlign: 'center', marginBottom: 56, letterSpacing: '-0.03em',
            lineHeight: 1.15, color: '#fff',
          }}>
            O que voce nao ve{' '}
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>esta custando caro.</span>
          </h2>
        </Reveal>

        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16,
        }}>
          {questions.map((q, i) => {
            const Icon = q.icon;
            return (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16, padding: 28,
                  borderRadius: 16, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'border-color 0.3s',
                }}>
                  <Icon size={20} color={ACCENT_FROM} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{
                    fontFamily: FONT_BODY, fontSize: 15, fontWeight: 500,
                    color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
                  }}>
                    {q.text}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Separator line */}
        <div style={{
          marginTop: 80, height: 1, width: '100%',
          background: `linear-gradient(90deg, transparent, ${ACCENT_FROM}40, ${ACCENT_TO}30, transparent)`,
        }} />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 3: FEATURES (3 MODULES)
   ═══════════════════════════════════════════════════════════ */

function FeaturesSection() {
  const isMobile = useIsMobileLanding();
  const modules = [
    {
      icon: LayoutDashboard, title: 'Painel Inteligente', tag: 'OPTIMIZER',
      desc: 'Metricas que importam, alertas automaticos, escala com seguranca.',
      color: '#60a5fa',
    },
    {
      icon: Link2, title: 'Tracking Real', tag: 'UTM STUDIO',
      desc: 'Saiba de onde vem suas vendas. UTMs, webhooks, reconciliacao financeira.',
      color: '#4ade80',
    },
    {
      icon: Sparkles, title: 'Analise com IA', tag: 'CREATIVE INTEL',
      desc: 'Claude Vision analisa seus criativos como um media buyer senior.',
      color: '#a78bfa',
    },
  ];

  return (
    <section id="features" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Dark portion */}
      <div style={{
        background: DARK_BG,
        padding: isMobile ? '80px 20px 0' : '120px 48px 0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Reveal>
            <h2 style={{
              fontFamily: FONT_BODY, fontSize: isMobile ? 28 : 44, fontWeight: 700,
              textAlign: 'center', marginBottom: 60, letterSpacing: '-0.03em',
              color: '#fff',
            }}>
              3 modulos.{' '}
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Uma plataforma.</span>
            </h2>
          </Reveal>

          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24,
            paddingBottom: isMobile ? 80 : 120,
          }}>
            {modules.map((m, i) => {
              const Icon = m.icon;
              return (
                <Reveal key={i} delay={i * 0.15}>
                  <TiltCard style={{ height: '100%' }}>
                    {/* Accent line at top */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, ${m.color}, transparent)`,
                      borderRadius: '20px 20px 0 0',
                    }} />

                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                      marginBottom: 20,
                    }}>
                      <Icon size={22} color={m.color} />
                    </div>

                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
                      color: m.color, letterSpacing: '0.1em', opacity: 0.8,
                    }}>
                      {m.tag}
                    </span>

                    <h3 style={{
                      fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700,
                      color: '#f0f4f8', marginTop: 8, marginBottom: 12,
                    }}>
                      {m.title}
                    </h3>

                    <p style={{
                      fontFamily: FONT_BODY, fontSize: 15, color: 'rgba(240,244,248,0.5)',
                      lineHeight: 1.6, margin: 0,
                    }}>
                      {m.desc}
                    </p>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gradient transition dark → light */}
      <div style={{
        height: 200,
        background: `linear-gradient(${DARK_BG}, ${LIGHT_BG})`,
      }} />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 4: STATS
   ═══════════════════════════════════════════════════════════ */

function StatsSection() {
  const isMobile = useIsMobileLanding();
  const { ref, visible } = useInView(0.3);
  const stat1 = useCountUp(95, 1600, visible);
  const stat2 = useCountUp(15, 1600, visible);
  const stat3 = useCountUp(8.5, 1600, visible);

  return (
    <section style={{
      background: LIGHT_BG, overflow: 'hidden',
      padding: isMobile ? '80px 20px' : '120px 48px',
    }}>
      <div ref={ref} style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <h2 style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 28 : 44, fontWeight: 700,
            letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 64,
          }}>
            Resultados reais.
          </h2>
        </Reveal>

        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 40,
        }}>
          {[
            { value: stat1, suffix: '%', label: 'Dados capturados pelo Gateway' },
            { value: stat2, prefix: '-', suffix: '%', label: 'Reducao media no CPA' },
            { value: stat3, label: 'EMQ Score medio' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div>
                <div style={{
                  fontFamily: FONT_DISPLAY, fontSize: isMobile ? 56 : 72, fontWeight: 700,
                  lineHeight: 1, marginBottom: 12,
                  background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {s.prefix || ''}{s.suffix === '%' ? Math.round(s.value) : s.value.toFixed(1)}{s.suffix || ''}
                </div>
                <div style={{
                  fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
                  color: '#64748b',
                }}>
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 5: PRICING
   ═══════════════════════════════════════════════════════════ */

function PricingSection() {
  const isMobile = useIsMobileLanding();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter', price: 97, desc: 'Para quem esta comecando',
      popular: false,
      features: [
        { text: '1 conta de anuncio', ok: true },
        { text: 'Dashboard Optimizer', ok: true },
        { text: 'UTM Tracking basico', ok: true },
        { text: 'Signal Gateway', ok: false },
        { text: 'Analise IA de criativos', ok: false },
        { text: 'Auto-Scale', ok: false },
        { text: 'Suporte prioritario', ok: false },
      ],
    },
    {
      name: 'Pro', price: 197, desc: 'Para gestores que querem escalar',
      popular: true,
      features: [
        { text: '5 contas de anuncio', ok: true },
        { text: 'Dashboard Optimizer', ok: true },
        { text: 'UTM Tracking completo', ok: true },
        { text: 'Signal Gateway (CAPI)', ok: true },
        { text: 'Analise IA de criativos', ok: true },
        { text: 'Auto-Scale', ok: true },
        { text: 'Suporte prioritario', ok: false },
      ],
    },
    {
      name: 'Agency', price: 497, desc: 'Para agencias e operacoes avancadas',
      popular: false,
      features: [
        { text: 'Contas ilimitadas', ok: true },
        { text: 'Dashboard Optimizer', ok: true },
        { text: 'UTM Tracking completo', ok: true },
        { text: 'Signal Gateway (CAPI)', ok: true },
        { text: 'Analise IA de criativos', ok: true },
        { text: 'Auto-Scale + Apex AI', ok: true },
        { text: 'Suporte prioritario 24/7', ok: true },
      ],
    },
  ];

  return (
    <section id="pricing" style={{
      background: LIGHT_BG, overflow: 'hidden',
      padding: isMobile ? '80px 20px' : '120px 48px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 28 : 44, fontWeight: 700,
            textAlign: 'center', letterSpacing: '-0.03em', color: '#0f172a',
            marginBottom: 12,
          }}>
            Escolha seu plano
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 16, color: '#94a3b8',
            textAlign: 'center', marginBottom: 56,
          }}>
            Todos os planos incluem 7 dias de garantia incondicional
          </p>
        </Reveal>

        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 20, alignItems: 'start',
        }}>
          {plans.map((plan, i) => {
            const isHovered = hoveredPlan === plan.name;
            const isPro = plan.popular;
            return (
              <Reveal key={plan.name} delay={i * 0.1}>
                <div
                  onMouseEnter={() => setHoveredPlan(plan.name)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  style={{
                    borderRadius: 22, padding: isPro ? 2 : 0,
                    background: isPro
                      ? `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO}, ${ACCENT_FROM})`
                      : 'transparent',
                    backgroundSize: isPro ? '200% 200%' : undefined,
                    animation: isPro ? 'gradient-shift 3s linear infinite' : undefined,
                    transform: isPro ? 'scale(1.02)' : (isHovered ? 'scale(1.01)' : 'scale(1)'),
                    transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <div style={{
                    background: '#fff', borderRadius: 20, padding: 32,
                    border: isPro ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
                    display: 'flex', flexDirection: 'column', height: '100%',
                  }}>
                    {isPro && (
                      <div style={{
                        alignSelf: 'flex-start', padding: '4px 14px', borderRadius: 100,
                        marginBottom: 16,
                        background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
                        color: '#fff', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
                      }}>
                        Mais Popular
                      </div>
                    )}

                    <h3 style={{
                      fontFamily: FONT_BODY, fontSize: 20, fontWeight: 700,
                      color: '#0f172a', marginBottom: 4,
                    }}>
                      {plan.name}
                    </h3>
                    <p style={{
                      fontFamily: FONT_BODY, fontSize: 14, color: '#94a3b8', marginBottom: 20,
                    }}>
                      {plan.desc}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: '#94a3b8' }}>R$</span>
                      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 700, color: '#0f172a' }}>{plan.price}</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: '#94a3b8' }}>/mes</span>
                    </div>

                    <div style={{ flex: 1, marginBottom: 28 }}>
                      {plan.features.map((f, fi) => (
                        <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                          {f.ok
                            ? <Check size={16} color="#4ade80" />
                            : <X size={16} color="#d1d5db" />
                          }
                          <span style={{
                            fontFamily: FONT_BODY, fontSize: 14,
                            color: f.ok ? '#334155' : '#94a3b8',
                          }}>
                            {f.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => window.open('#', '_blank')}
                      style={{
                        width: '100%', padding: '14px 0', borderRadius: 12,
                        fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                        border: isPro ? 'none' : `1.5px solid rgba(37,99,235,0.3)`,
                        background: isPro ? `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` : 'transparent',
                        color: isPro ? '#fff' : ACCENT_FROM,
                        transition: 'all 0.2s',
                      }}
                    >
                      Comecar com {plan.name}
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 6: FAQ
   ═══════════════════════════════════════════════════════════ */

function FAQSection() {
  const isMobile = useIsMobileLanding();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    { q: 'O que e o Ads Everest?', a: 'Ads Everest e uma plataforma all-in-one para gestores de trafego que querem otimizar campanhas de Meta Ads. Inclui dashboards inteligentes, rastreamento UTM, analise de criativos com IA e Signal Gateway para CAPI.' },
    { q: 'Preciso de conhecimento tecnico para usar?', a: 'Nao. A plataforma foi projetada para ser intuitiva. Voce conecta sua conta de anuncios e o Ads Everest faz o resto. Temos tutoriais e suporte para qualquer duvida.' },
    { q: 'O que e o Signal Gateway?', a: 'E nossa tecnologia de rastreamento server-side que envia dados diretamente para a Meta via Conversions API (CAPI Level 5). Isso recupera ate 40% dos dados de conversao que o pixel perde.' },
    { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Nao existe fidelidade ou contrato. Voce pode cancelar quando quiser diretamente na plataforma. Oferecemos 7 dias de garantia incondicional.' },
    { q: 'Funciona com Google Ads e TikTok?', a: 'Sim! Alem do Meta (Facebook/Instagram), o Ads Everest suporta Google Ads, TikTok Ads e Kwai Ads. Tudo em um unico painel.' },
    { q: 'Como funciona a analise de criativos com IA?', a: 'Nossa IA analisa imagens e videos dos seus anuncios, identificando padroes de fadiga, elementos visuais que performam melhor e sugerindo otimizacoes como um media buyer senior faria.' },
    { q: 'Quantas contas de anuncios posso conectar?', a: 'Depende do plano: Starter (1 conta), Pro (5 contas), Agency (ilimitado). Cada conta pode ter multiplas campanhas.' },
  ];

  return (
    <section id="faq" style={{
      background: LIGHT_BG, overflow: 'hidden',
      padding: isMobile ? '80px 20px' : '120px 48px',
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 28 : 44, fontWeight: 700,
            textAlign: 'center', letterSpacing: '-0.03em', color: '#0f172a',
            marginBottom: 48,
          }}>
            Perguntas frequentes
          </h2>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <Reveal key={i} delay={i * 0.04}>
                <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    style={{
                      width: '100%', padding: '20px 0', background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600,
                      color: '#0f172a', textAlign: 'left',
                    }}
                  >
                    {faq.q}
                    <ChevronDown size={18} style={{
                      color: '#94a3b8', flexShrink: 0, marginLeft: 16,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </button>
                  <div style={{
                    maxHeight: isOpen ? 200 : 0, overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1)',
                  }}>
                    <p style={{
                      padding: '0 0 20px', margin: 0,
                      fontFamily: FONT_BODY, fontSize: 14, color: '#64748b', lineHeight: 1.7,
                    }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 7: FINAL CTA + FOOTER
   ═══════════════════════════════════════════════════════════ */

function FinalCTASection() {
  const isMobile = useIsMobileLanding();

  return (
    <section style={{
      position: 'relative', background: DARK_BG, overflow: 'hidden',
      padding: isMobile ? '100px 20px 60px' : '160px 48px 80px',
      textAlign: 'center',
    }}>
      {/* Floating orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        top: '5%', left: '10%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)',
        animation: 'orb-drift-1 10s ease-in-out infinite', filter: 'blur(80px)',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        bottom: '10%', right: '10%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(124,58,237,0.1), transparent 70%)',
        animation: 'orb-drift-2 12s ease-in-out infinite', filter: 'blur(80px)',
      }} />
      <div style={{
        position: 'absolute', width: 250, height: 250, borderRadius: '50%',
        top: '40%', left: '55%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)',
        animation: 'orb-drift-3 14s ease-in-out infinite', filter: 'blur(100px)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '0 auto' }}>
        <Reveal>
          <h2 style={{
            fontFamily: FONT_BODY, fontSize: isMobile ? 32 : 48, fontWeight: 700,
            letterSpacing: '-0.03em', color: '#fff', marginBottom: 16, lineHeight: 1.1,
          }}>
            Comece a escalar hoje.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 18, color: 'rgba(255,255,255,0.5)',
            marginBottom: 40,
          }}>
            7 dias de garantia. Cancele quando quiser.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <CTAButton large href="#pricing">
            Comecar agora <ArrowUpRight size={18} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
          </CTAButton>
        </Reveal>
      </div>

      {/* Footer */}
      <div style={{
        position: 'relative', zIndex: 2, marginTop: 120,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 24, flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          &copy; 2026 Ads.Everest
        </span>
        <a href="#" style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Termos</a>
        <a href="#" style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Privacidade</a>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — MAIN EXPORT
   ═══════════════════════════════════════════════════════════ */

export default function Landing() {
  return (
    <div className="landing-page" style={{ minHeight: '100vh', overflowX: 'hidden', background: DARK_BG }}>
      <GlobalStyles />
      <Nav />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  );
}
