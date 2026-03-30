import { useState, useEffect, useRef, useCallback, type CSSProperties, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  BarChart3, Link2, Sparkles, ArrowRight, Check, X, ChevronDown,
  TrendingUp, Eye, DollarSign, Target, Zap, Shield, ArrowUpRight,
  HelpCircle, Layers,
} from 'lucide-react';

/* ─── Hooks ─── */

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setIsInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isInView };
}

function useCountUp(end: number, duration = 2000, startOnView = false, isInView = true) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (startOnView && !isInView) return;
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased * 10) / 10);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration, startOnView, isInView]);
  return value;
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
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

/* ─── Reusable subcomponents ─── */

function GrainOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, opacity: 0.02,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    }} />
  );
}

function CursorGlow({ sectionRef }: { sectionRef: React.RefObject<HTMLDivElement | null> }) {
  const mouse = useMousePosition();
  const [rel, setRel] = useState({ x: 0, y: 0, visible: false });
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const inside = mouse.x >= rect.left && mouse.x <= rect.right && mouse.y >= rect.top && mouse.y <= rect.bottom;
    if (inside) {
      setRel({ x: mouse.x - rect.left, y: mouse.y - rect.top, visible: true });
    } else {
      setRel(p => ({ ...p, visible: false }));
    }
  }, [mouse, sectionRef]);
  if (!rel.visible) return null;
  return (
    <div style={{
      position: 'absolute', left: rel.x - 200, top: rel.y - 200, width: 400, height: 400,
      borderRadius: '50%', pointerEvents: 'none',
      background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
      transition: 'opacity 0.3s', zIndex: 1,
    }} />
  );
}

function SectionWrapper({ children, dark = false, id, style, sectionRef }: {
  children: ReactNode; dark?: boolean; id?: string; style?: CSSProperties;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const isMobile = useIsMobileLanding();
  return (
    <section ref={sectionRef} id={id} style={{
      position: 'relative', width: '100%', overflow: 'hidden',
      background: dark ? '#060a13' : '#fafbfc',
      color: dark ? '#f0f4f8' : '#0f172a',
      padding: isMobile ? '60px 20px' : '100px 40px',
      ...style,
    }}>
      {children}
    </section>
  );
}

function Container({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2, ...style }}>{children}</div>;
}

function GradientButton({ children, outline = false, style, onClick }: {
  children: ReactNode; outline?: boolean; style?: CSSProperties; onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  if (outline) {
    return (
      <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
        padding: '14px 32px', borderRadius: 12, fontWeight: 600, fontSize: 16, cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif", border: '1.5px solid rgba(37,99,235,0.4)',
        background: hovered ? 'rgba(37,99,235,0.08)' : 'transparent', color: '#2563eb',
        transition: 'all 0.2s', ...style,
      }}>{children}</button>
    );
  }
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      padding: '14px 32px', borderRadius: 12, fontWeight: 600, fontSize: 16, cursor: 'pointer',
      fontFamily: "'Plus Jakarta Sans', sans-serif", border: 'none', color: '#fff',
      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
      boxShadow: hovered ? '0 0 30px rgba(99,102,241,0.4)' : '0 4px 16px rgba(37,99,235,0.2)',
      transform: hovered ? 'translateY(-1px)' : 'none', transition: 'all 0.2s', ...style,
    }}>{children}</button>
  );
}

function TiltCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(1000px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`);
  }, []);
  const handleLeave = useCallback(() => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  }, []);
  return (
    <div ref={cardRef} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{
      transform, transition: 'transform 0.15s ease-out',
      background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── SECTIONS ─── */

function HeroSection() {
  const isMobile = useIsMobileLanding();
  const { scrollY } = useScroll();
  const mockupY = useTransform(scrollY, [0, 600], [0, -40]);

  return (
    <SectionWrapper id="hero" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '16px 20px' : '20px 40px', position: 'relative', zIndex: 10,
      }}>
        <img src="/logo-everest.png" alt="Ads Everest" style={{ height: 36 }} />
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 500 }}>
            <a href="#features" style={{ color: '#475569', textDecoration: 'none' }}>Features</a>
            <a href="#pricing" style={{ color: '#475569', textDecoration: 'none' }}>Precos</a>
            <a href="#faq" style={{ color: '#475569', textDecoration: 'none' }}>FAQ</a>
          </div>
        )}
        <GradientButton style={{ padding: '10px 24px', fontSize: 14 }} onClick={() => {
          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
        }}>Comecar agora</GradientButton>
      </nav>

      {/* Hero content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '40px 20px' : '60px 40px', textAlign: 'center', position: 'relative', zIndex: 2,
      }}>
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))',
            border: '1px solid rgba(37,99,235,0.2)', marginBottom: 32,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#6366f1',
          }}>
          <Sparkles size={14} /> Plataforma #1 para gestores de trafego
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 32 : 48, fontWeight: 700,
            lineHeight: 1.15, maxWidth: 720, margin: '0 0 20px', color: '#0f172a',
            letterSpacing: '-0.02em',
          }}>
          Seus anuncios custam caro porque voce opera no escuro.
        </motion.h1>

        {/* Subheadline */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 16 : 20, fontWeight: 400,
            color: '#64748b', maxWidth: 580, margin: '0 0 36px', lineHeight: 1.6,
          }}>
          Ads Everest mostra onde cada real do seu budget vira lucro — ou desaparece.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
          <GradientButton onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
            Comecar agora <ArrowRight size={16} style={{ marginLeft: 4, verticalAlign: 'middle' }} /> R$97/mes
          </GradientButton>
          <GradientButton outline>Ver demo</GradientButton>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#94a3b8' }}>
          7 dias de garantia &middot; Sem fidelidade &middot; Cancele quando quiser
        </motion.p>

        {/* Mockup card */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, type: 'spring', stiffness: 50 }}
          style={{ y: mockupY as unknown as number, marginTop: 60, position: 'relative', width: '100%', maxWidth: 800 }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', inset: -40, borderRadius: 40, zIndex: -1,
            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)',
            animation: 'pulseGlow 4s ease-in-out infinite',
          }} />
          <div style={{
            background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.06)', borderRadius: 20, padding: isMobile ? 20 : 32,
            transform: isMobile ? 'none' : 'perspective(1200px) rotateX(4deg) rotateY(-2deg)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.08)',
          }}>
            {/* Mini dashboard mockup */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'ROAS', val: '4.2x', color: '#4ade80' },
                { label: 'CPA', val: 'R$18', color: '#60a5fa' },
                { label: 'EMQ', val: '8.7', color: '#a78bfa' },
                { label: 'Conversoes', val: '247', color: '#f59e0b' },
              ].map(m => (
                <div key={m.label} style={{
                  flex: 1, padding: isMobile ? 10 : 16, borderRadius: 12,
                  background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: isMobile ? 18 : 24, fontWeight: 700, color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>
            {/* Chart placeholder */}
            <div style={{ height: 120, borderRadius: 12, background: 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(99,102,241,0.01) 100%)', border: '1px solid rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 800 120" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 100 Q100 80 200 60 T400 40 T600 30 T800 20 L800 120 L0 120Z" fill="url(#chartFill)" />
                <path d="M0 100 Q100 80 200 60 T400 40 T600 30 T800 20" fill="none" stroke="#6366f1" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -20px); }
          66% { transform: translate(-20px, 10px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-25px, 15px); }
          66% { transform: translate(15px, -25px); }
        }
        @keyframes gradientBorderSpin {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </SectionWrapper>
  );
}

function ProblemSection() {
  const isMobile = useIsMobileLanding();
  const questions = [
    { icon: DollarSign, text: 'Qual campanha trouxe mais lucro real esse mes?' },
    { icon: Target, text: 'Qual criativo esta fadigado e precisa ser pausado?' },
    { icon: Eye, text: 'De onde vieram os clientes que compraram ontem?' },
    { icon: TrendingUp, text: 'Quanto do seu orcamento esta sendo desperdicado?' },
  ];
  return (
    <SectionWrapper id="problem">
      <Container>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 24 : 36, fontWeight: 700,
            textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em', lineHeight: 1.3,
          }}>
          Voce gasta R$5.000/mes em ads e nao sabe responder:
        </motion.h2>
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 20,
        }}>
          {questions.map((q, i) => {
            const { ref, isInView } = useInView(0.3);
            const Icon = q.icon;
            return (
              <motion.div ref={ref} key={i}
                initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: 24, borderRadius: 16,
                  background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))',
                }}>
                  <Icon size={22} color="#6366f1" />
                </div>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 500, flex: 1 }}>{q.text}</span>
                <HelpCircle size={18} color="#cbd5e1" />
              </motion.div>
            );
          })}
        </div>
      </Container>
    </SectionWrapper>
  );
}

function SolutionSection() {
  const isMobile = useIsMobileLanding();
  const modules = [
    { icon: BarChart3, title: 'OPTIMIZER', desc: 'Dashboards inteligentes que mostram o que importa', color: '#60a5fa' },
    { icon: Link2, title: 'UTM STUDIO', desc: 'Saiba exatamente de onde vem suas vendas', color: '#4ade80' },
    { icon: Sparkles, title: 'CREATIVE INTEL', desc: 'IA que analisa seus criativos como um media buyer senior', color: '#a78bfa' },
  ];
  return (
    <SectionWrapper id="features" style={{
      background: 'linear-gradient(180deg, #fafbfc 0%, #060a13 100%)',
      padding: isMobile ? '60px 20px' : '120px 40px',
    }}>
      <Container>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 28 : 40, fontWeight: 700,
            textAlign: 'center', marginBottom: 60, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #0f172a 0%, #f0f4f8 100%)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
          3 modulos. Uma plataforma.
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 24 }}>
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}>
                <TiltCard style={{ height: '100%' }}>
                  <div style={{
                    height: 3, borderRadius: 2, marginBottom: 24, width: 60,
                    background: `linear-gradient(90deg, ${m.color}, transparent)`,
                  }} />
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `rgba(255,255,255,0.06)`, border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 20,
                  }}>
                    <Icon size={24} color={m.color} />
                  </div>
                  <h3 style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 12,
                    color: '#f0f4f8', letterSpacing: '0.05em',
                  }}>{m.title}</h3>
                  <p style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, color: 'rgba(240,244,248,0.6)',
                    lineHeight: 1.6, margin: 0,
                  }}>{m.desc}</p>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </SectionWrapper>
  );
}

function DemoSection() {
  const isMobile = useIsMobileLanding();
  const darkRef = useRef<HTMLDivElement>(null);
  return (
    <SectionWrapper dark id="demo" sectionRef={darkRef}>
      <CursorGlow sectionRef={darkRef} />
      <Container style={{ textAlign: 'center' }}>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 24 : 36, fontWeight: 700,
            marginBottom: 48, letterSpacing: '-0.02em',
          }}>
          Veja o Ads Everest em acao
        </motion.h2>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8 }} style={{
            borderRadius: 20, padding: 2, animation: 'floatY 6s ease-in-out infinite',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed, #2563eb)',
            backgroundSize: '200% 200%',
            animationName: 'gradientBorderSpin, floatY',
            animationDuration: '3s, 6s',
            animationTimingFunction: 'linear, ease-in-out',
            animationIterationCount: 'infinite',
          }}>
          <div style={{
            background: '#0c0e1a', borderRadius: 18, padding: isMobile ? 20 : 40,
          }}>
            {/* Dashboard mockup */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {['Campanhas', 'Criativos', 'UTMs', 'Signal'].map(tab => (
                <div key={tab} style={{
                  padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  background: tab === 'Campanhas' ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'rgba(255,255,255,0.05)',
                  color: tab === 'Campanhas' ? '#fff' : '#64748b',
                  border: tab === 'Campanhas' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                }}>{tab}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { l: 'Gasto Total', v: 'R$12.480', d: '+8%', c: '#f0f4f8' },
                { l: 'Receita', v: 'R$52.800', d: '+23%', c: '#4ade80' },
                { l: 'ROAS', v: '4.23x', d: '+0.5', c: '#a78bfa' },
                { l: 'EMQ Score', v: '8.7', d: 'Excelente', c: '#60a5fa' },
              ].map(c => (
                <div key={c.l} style={{
                  padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: '#64748b', marginBottom: 6 }}>{c.l}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: c.c }}>{c.v}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4ade80', marginTop: 4 }}>{c.d}</div>
                </div>
              ))}
            </div>
            {/* Chart area */}
            <div style={{ height: 140, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <svg viewBox="0 0 800 140" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="demoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 120 C80 100 160 90 240 70 C320 50 400 60 480 45 C560 30 640 35 720 25 L800 20 L800 140 L0 140Z" fill="url(#demoFill)" />
                <path d="M0 120 C80 100 160 90 240 70 C320 50 400 60 480 45 C560 30 640 35 720 25 L800 20" fill="none" stroke="#7c3aed" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </motion.div>
      </Container>
    </SectionWrapper>
  );
}

function SignalSection() {
  const isMobile = useIsMobileLanding();
  const darkRef = useRef<HTMLDivElement>(null);
  const { ref: statsRef, isInView } = useInView(0.4);
  const emq = useCountUp(8.5, 2000, true, isInView);
  const cpa = useCountUp(15, 2000, true, isInView);
  const data = useCountUp(40, 2000, true, isInView);

  return (
    <SectionWrapper dark id="signal" sectionRef={darkRef}>
      <CursorGlow sectionRef={darkRef} />
      <Container style={{ textAlign: 'center' }}>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 22 : 32, fontWeight: 700,
            marginBottom: 16, letterSpacing: '-0.02em',
          }}>
          O Meta so ve 60% dos seus dados. Nos entregamos 95%.
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, color: '#94a3b8', marginBottom: 48 }}>
          Signal Gateway: rastreamento server-side que recupera dados perdidos
        </motion.p>

        {/* Flow */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 12 : 24,
            marginBottom: 48, flexWrap: 'wrap',
          }}>
          {[
            { label: 'Visitante', icon: Eye },
            { label: 'Signal Gateway', icon: Zap },
            { label: 'Meta CAPI', icon: Shield },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
                <div style={{
                  padding: '16px 24px', borderRadius: 16,
                  background: i === 1 ? 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.2))' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 1 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Icon size={18} color={i === 1 ? '#818cf8' : '#94a3b8'} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{step.label}</span>
                </div>
                {i < 2 && <ArrowRight size={18} color="#475569" />}
              </div>
            );
          })}
        </motion.div>

        {/* Stats */}
        <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { label: 'EMQ Score', value: emq, suffix: '+', color: '#60a5fa' },
            { label: 'CPA Reducao', value: cpa, suffix: '%', prefix: '-', color: '#4ade80' },
            { label: 'Dados Recuperados', value: data, suffix: '%', prefix: '+', color: '#a78bfa' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{
                padding: 28, borderRadius: 18, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700, color: s.color }}>
                {s.prefix || ''}{s.value}{s.suffix}
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#94a3b8', marginTop: 8 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}

function ComparisonSection() {
  const isMobile = useIsMobileLanding();
  const rows = [
    { feature: 'Dashboard de campanhas em tempo real', everest: true, utmify: true, manual: false },
    { feature: 'Rastreamento UTM automatizado', everest: true, utmify: true, manual: false },
    { feature: 'Signal Gateway (CAPI Level 5)', everest: true, utmify: false, manual: false },
    { feature: 'Analise de criativos com IA', everest: true, utmify: false, manual: false },
    { feature: 'Auto-Scale de budget', everest: true, utmify: false, manual: false },
    { feature: 'EMQ Score (qualidade de sinal)', everest: true, utmify: false, manual: false },
    { feature: 'Alertas inteligentes', everest: true, utmify: true, manual: false },
    { feature: 'Multi-plataforma (Meta, Google, TikTok)', everest: true, utmify: false, manual: true },
  ];

  return (
    <SectionWrapper id="comparison">
      <Container>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 24 : 36, fontWeight: 700,
            textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em',
          }}>
          Por que Ads Everest?
        </motion.h2>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'separate', borderSpacing: 0,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, minWidth: 600,
          }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px 20px', color: '#64748b', fontWeight: 500 }}>Funcionalidade</th>
                <th style={{
                  padding: '16px 20px', textAlign: 'center', fontWeight: 700, color: '#fff',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '12px 12px 0 0',
                }}>Ads Everest</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>UTMify</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Manual</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 500 }}>{r.feature}</td>
                  <td style={{
                    padding: '14px 20px', textAlign: 'center',
                    background: 'linear-gradient(180deg, rgba(37,99,235,0.04), rgba(124,58,237,0.04))',
                    borderLeft: '1px solid rgba(99,102,241,0.1)', borderRight: '1px solid rgba(99,102,241,0.1)',
                  }}>
                    {r.everest ? <Check size={18} color="#4ade80" /> : <X size={18} color="#f87171" />}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {r.utmify ? <Check size={18} color="#4ade80" /> : <X size={18} color="#f87171" />}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    {r.manual ? <Check size={18} color="#4ade80" /> : <X size={18} color="#f87171" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </Container>
    </SectionWrapper>
  );
}

function TestimonialsSection() {
  const isMobile = useIsMobileLanding();
  const testimonials = [
    { name: 'Rafael Mendes', role: 'Gestor de Trafego', result: 'ROAS subiu de 2.1 para 4.8 em 30 dias', text: 'Finalmente consigo ver de onde vem cada venda. O Signal Gateway mudou tudo.' },
    { name: 'Camila Santos', role: 'Agencia Digital', result: '-42% no CPA medio', text: 'Gerencio 12 contas e o Ads Everest me economiza 3h por dia com os dashboards automaticos.' },
    { name: 'Lucas Ferreira', role: 'E-commerce Owner', result: '+R$180k receita/mes', text: 'A analise de criativos com IA me mostrou que 60% do meu budget ia pra anuncios fadigados.' },
  ];
  const colors = ['#60a5fa', '#a78bfa', '#4ade80'];

  return (
    <SectionWrapper id="testimonials">
      <Container>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 24 : 36, fontWeight: 700,
            textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em',
          }}>
          Quem usa, escala.
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{
                padding: 28, borderRadius: 18,
                background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors[i]}, ${colors[(i + 1) % 3]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#fff',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#94a3b8' }}>{t.role}</div>
                </div>
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#6366f1',
                marginBottom: 12, padding: '6px 12px', borderRadius: 8,
                background: 'rgba(99,102,241,0.06)', display: 'inline-block',
              }}>{t.result}</div>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#475569',
                lineHeight: 1.7, margin: 0,
              }}>"{t.text}"</p>
              <div style={{ display: 'flex', gap: 2, marginTop: 12 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} style={{ color: '#facc15', fontSize: 16 }}>&#9733;</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}

function PricingSection() {
  const isMobile = useIsMobileLanding();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const plans = [
    {
      name: 'Starter', price: 97, desc: 'Para quem esta comecando',
      features: [
        { text: '1 conta de anuncio', included: true },
        { text: 'Dashboard Optimizer', included: true },
        { text: 'UTM Tracking basico', included: true },
        { text: 'Signal Gateway', included: false },
        { text: 'Analise IA de criativos', included: false },
        { text: 'Auto-Scale', included: false },
        { text: 'Suporte prioritario', included: false },
      ],
      popular: false,
    },
    {
      name: 'Pro', price: 197, desc: 'Para gestores que querem escalar',
      features: [
        { text: '5 contas de anuncio', included: true },
        { text: 'Dashboard Optimizer', included: true },
        { text: 'UTM Tracking completo', included: true },
        { text: 'Signal Gateway (CAPI)', included: true },
        { text: 'Analise IA de criativos', included: true },
        { text: 'Auto-Scale', included: true },
        { text: 'Suporte prioritario', included: false },
      ],
      popular: true,
    },
    {
      name: 'Agency', price: 497, desc: 'Para agencias e operacoes avancadas',
      features: [
        { text: 'Contas ilimitadas', included: true },
        { text: 'Dashboard Optimizer', included: true },
        { text: 'UTM Tracking completo', included: true },
        { text: 'Signal Gateway (CAPI)', included: true },
        { text: 'Analise IA de criativos', included: true },
        { text: 'Auto-Scale + Apex AI', included: true },
        { text: 'Suporte prioritario 24/7', included: true },
      ],
      popular: false,
    },
  ];

  return (
    <SectionWrapper id="pricing">
      <Container>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 24 : 36, fontWeight: 700,
            textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em',
          }}>
          Escolha seu plano
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 48 }}>
          Todos os planos incluem 7 dias de garantia incondicional
        </motion.p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
          {plans.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setHoveredPlan(plan.name)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                padding: 2, borderRadius: 22,
                background: plan.popular
                  ? 'linear-gradient(135deg, #2563eb, #7c3aed, #2563eb)'
                  : 'rgba(0,0,0,0.06)',
                backgroundSize: plan.popular ? '200% 200%' : undefined,
                animation: plan.popular ? 'gradientBorderSpin 3s linear infinite' : undefined,
                transform: plan.popular ? 'scale(1.05)' : (hoveredPlan === plan.name ? 'scale(1.02)' : 'scale(1)'),
                transition: 'transform 0.2s',
              }}>
              <div style={{
                background: '#fafbfc', borderRadius: 20, padding: 32, height: '100%',
                display: 'flex', flexDirection: 'column',
              }}>
                {plan.popular && (
                  <div style={{
                    alignSelf: 'flex-start', padding: '4px 14px', borderRadius: 100, marginBottom: 16,
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
                  }}>Mais Popular</div>
                )}
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>{plan.desc}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#94a3b8' }}>R$</span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 700, color: '#0f172a' }}>{plan.price}</span>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#94a3b8' }}>/mes</span>
                </div>
                <div style={{ flex: 1, marginBottom: 24 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                      {f.included
                        ? <Check size={16} color="#4ade80" />
                        : <X size={16} color="#d1d5db" />
                      }
                      <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14,
                        color: f.included ? '#334155' : '#94a3b8',
                      }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <GradientButton
                  outline={!plan.popular}
                  style={{ width: '100%', textAlign: 'center' }}
                  onClick={() => window.open('#', '_blank')}
                >
                  Comecar com {plan.name}
                </GradientButton>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}

function FAQSection() {
  const isMobile = useIsMobileLanding();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: 'O que e o Ads Everest?', a: 'Ads Everest e uma plataforma all-in-one para gestores de trafego que querem otimizar campanhas de anuncios pagos. Inclui dashboards inteligentes, rastreamento UTM, analise de criativos com IA e Signal Gateway para CAPI.' },
    { q: 'Preciso de conhecimento tecnico para usar?', a: 'Nao. A plataforma foi projetada para ser intuitiva. Voce conecta sua conta de anuncios e o Ads Everest faz o resto. Temos tutoriais e suporte para qualquer duvida.' },
    { q: 'O que e o Signal Gateway?', a: 'E nossa tecnologia de rastreamento server-side que envia dados diretamente para a Meta via Conversions API (CAPI Level 5). Isso recupera ate 40% dos dados de conversao que o pixel perde.' },
    { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Nao existe fidelidade ou contrato. Voce pode cancelar quando quiser diretamente na plataforma. Oferecemos 7 dias de garantia incondicional.' },
    { q: 'Funciona com Google Ads e TikTok?', a: 'Sim! Alem do Meta (Facebook/Instagram), o Ads Everest suporta Google Ads, TikTok Ads e Kwai Ads. Tudo em um unico painel.' },
    { q: 'Como funciona a analise de criativos com IA?', a: 'Nossa IA analisa imagens e videos dos seus anuncios, identificando padroes de fadiga, elementos visuais que performam melhor e sugerindo otimizacoes como um media buyer senior faria.' },
    { q: 'Quantas contas de anuncios posso conectar?', a: 'Depende do plano: Starter (1 conta), Pro (5 contas), Agency (ilimitado). Cada conta pode ter multiplas campanhas.' },
    { q: 'O pagamento e seguro?', a: 'Sim. Processamos pagamentos via Kiwify com criptografia SSL. Seus dados financeiros nunca sao armazenados em nossos servidores.' },
  ];

  return (
    <SectionWrapper id="faq">
      <Container style={{ maxWidth: 720 }}>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 24 : 36, fontWeight: 700,
            textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em',
          }}>
          Perguntas frequentes
        </motion.h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} style={{
                width: '100%', padding: '18px 20px', borderRadius: openIndex === i ? '14px 14px 0 0' : 14,
                background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)',
                borderBottom: openIndex === i ? '1px solid rgba(0,0,0,0.03)' : '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600,
                color: '#0f172a', textAlign: 'left',
              }}>
                {faq.q}
                <ChevronDown size={18} style={{
                  transform: openIndex === i ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s', color: '#94a3b8', flexShrink: 0, marginLeft: 12,
                }} />
              </button>
              <div style={{
                maxHeight: openIndex === i ? 200 : 0, overflow: 'hidden',
                transition: 'max-height 0.3s ease',
                background: 'rgba(255,255,255,0.8)', borderRadius: '0 0 14px 14px',
                border: openIndex === i ? '1px solid rgba(0,0,0,0.06)' : 'none',
                borderTop: 'none',
              }}>
                <p style={{
                  padding: '0 20px 18px', margin: 0,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#64748b', lineHeight: 1.7,
                }}>{faq.a}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}

function FinalCTASection() {
  const isMobile = useIsMobileLanding();
  const darkRef = useRef<HTMLDivElement>(null);
  return (
    <SectionWrapper dark id="final-cta" sectionRef={darkRef} style={{ textAlign: 'center', minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CursorGlow sectionRef={darkRef} />
      {/* Glowing orbs */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%', top: '10%', left: '10%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%)',
        animation: 'orbFloat1 8s ease-in-out infinite', filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', width: 250, height: 250, borderRadius: '50%', bottom: '15%', right: '15%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)',
        animation: 'orbFloat2 10s ease-in-out infinite', filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%', top: '50%', left: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)',
        animation: 'orbFloat1 12s ease-in-out infinite', filter: 'blur(80px)',
        transform: 'translate(-50%, -50%)',
      }} />

      <Container>
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: isMobile ? 28 : 44, fontWeight: 700,
            marginBottom: 16, letterSpacing: '-0.02em',
          }}>
          Pare de desperdicar budget.
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, color: '#94a3b8', marginBottom: 40,
          }}>
          7 dias de garantia. Cancele quando quiser.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <GradientButton style={{
            padding: '18px 48px', fontSize: 18,
            boxShadow: '0 0 40px rgba(99,102,241,0.3)',
          }} onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
            Comecar agora <ArrowUpRight size={18} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
          </GradientButton>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 32,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#64748b',
          }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} /> Seguro
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} /> Kiwify
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} /> SSL
          </span>
        </motion.div>
      </Container>
    </SectionWrapper>
  );
}

/* ─── Footer ─── */

function Footer() {
  return (
    <div style={{
      background: '#060a13', borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '24px 40px', textAlign: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#475569',
    }}>
      &copy; {new Date().getFullYear()} Ads Everest. Todos os direitos reservados.
    </div>
  );
}

/* ─── LANDING PAGE ─── */

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafbfc', overflowX: 'hidden' }}>
      <GrainOverlay />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <DemoSection />
      <SignalSection />
      <ComparisonSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
