'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmbience } from '@/components/AmbienceProvider';

// --- Cursor trail ---

type TrailDot = {
  x: number;
  y: number;
  size: number;
  life: number;
  decay: number;
  rotation: number;
  shape: number; // 0=circle 1=square 2=triangle 3=diamond 4=star
  color: string;
};

const TRAIL_SHAPES = [
  { color: '#1B2057' },  // circle — deep navy (the dark circles on the pot)
  { color: '#D4622B' },  // square — burnt orange (the orange petals)
  { color: '#5B8C5A' },  // triangle — sage green (the green leaves)
  { color: '#C8A84E' },  // diamond — gold (the crosshatch accents)
  { color: '#2A3A7D' },  // star — cobalt blue (the blue band)
];

function drawTrailShape(ctx: CanvasRenderingContext2D, d: TrailDot) {
  const s = d.size * (0.5 + 0.5 * d.life);
  ctx.save();
  ctx.globalAlpha = d.life;
  ctx.fillStyle = d.color;
  ctx.translate(d.x, d.y);
  ctx.rotate(d.rotation);
  if (d.shape === 0) {
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.shape === 1) {
    ctx.fillRect(-s / 2, -s / 2, s, s);
  } else if (d.shape === 2) {
    ctx.beginPath();
    ctx.moveTo(0, -s / 2);
    ctx.lineTo(s / 2, s / 2);
    ctx.lineTo(-s / 2, s / 2);
    ctx.closePath();
    ctx.fill();
  } else if (d.shape === 3) {
    ctx.beginPath();
    ctx.moveTo(0, -s / 2);
    ctx.lineTo(s / 2, 0);
    ctx.lineTo(0, s / 2);
    ctx.lineTo(-s / 2, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](s / 2 * Math.cos(angle), s / 2 * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

type Card = {
  label: string;
  title: string;
  year: string;
  role: string | null;
  description: string;
  link: string | null;
  video: string | null;
  cta: boolean;
};

const videos = [
  '/design/screen-recording-1.webm',
  '/design/screen-recording-2.webm',
  '/design/screen-recording-3.webm',
  '/design/screen-recording-4.webm',
];

const CTA_EMAIL = 'a@maxforsey.com';
const CTA_DESCRIPTION =
  'Open to collaborations in design, brand, and web for startups where craft matters.';

const namedCards: Record<number, Partial<Card>> = {
  0: {
    label: 'Parameter Golf · 2025',
    title: 'Parameter Golf',
    role: 'Brand identity and landing page — built in 48 hours',
    description:
      'RunPod x OpenAI research competition challenging developers to train the best small language model in under 10 minutes on 8xH100s. Launched to 500,000+ developers.',
    link: null,
    video: '/design/screen-recording-1.webm',
  },
  1: {
    label: 'JustBuild · 2025',
    title: 'JustBuild',
    role: 'Brand identity and landing page',
    description:
      'Created the brand and web presence for a builder community making Utah AI-native. 400+ member Slack, hackathons with $100K+ in prizes, and regular coworking sessions.',
    link: 'https://justbuild.ing',
    video: '/design/screen-recording-2.webm',
  },
  2: {
    label: 'Max Forsey · 2022',
    title: 'Max Forsey',
    year: '2022',
    role: 'Design + Build',
    description:
      'Personal site built from scratch for writing about AI, design, and systems. Includes blog, wiki, and project portfolio. Designed to feel intentional and minimal.',
    link: 'https://maxforsey.com',
    video: '/design/screen-recording-3.webm',
  },
  3: {
    label: 'Gather Bio · 2026',
    title: 'Gather Bio',
    year: '2026',
    role: 'Design + Build',
    description:
      'Designed and built the platform for patient-owned autoimmune research. Quarterly blood draws, flare tracking, and data ownership — participants earn when their data supports licensed research.',
    link: 'https://gatherbio.com',
    video: '/design/screen-recording-4.webm',
  },
  4: {
    label: 'AI Builder Day · 2026',
    title: 'AI Builder Day',
    year: '2026',
    role: 'Design + Build',
    description:
      'Designed the brand and site for Utah\'s biggest AI event — a two-day hackathon and conference in Draper bringing together founders, engineers, designers, investors, and students.',
    link: 'https://aibuilderday.com',
    video: '/design/ai-builder-day.webm',
  },
};

const TOTAL_CARDS = 6;
const CTA_INDEX = TOTAL_CARDS - 1;

const cards: Card[] = Array.from({ length: TOTAL_CARDS }, (_, i) => {
  if (i === CTA_INDEX) {
    return {
      label: 'Work with me',
      title: 'Work with me',
      year: '',
      role: null,
      description: '',
      link: null,
      video: null,
      cta: true,
    };
  }
  const n = String(i + 1).padStart(2, '0');
  const base: Card = {
    label: `Project ${n} · 2025`,
    title: `Project ${n}`,
    year: '2025',
    role: 'Design + Build',
    description:
      'A short description of the project — what it is, why it exists, and what was interesting about building it. Replace this placeholder with real copy when ready.',
    link: null,
    video: videos[i % videos.length],
    cta: false,
  };
  return { ...base, ...(namedCards[i] ?? {}) };
});

const BASE_Z = 336;
const TRANSITION = { type: 'spring' as const, stiffness: 200, damping: 30, mass: 1 };

function getCardWrapperStyle(
  index: number,
  scrollOffset: number,
  isHovered: boolean,
  isScrolling: boolean,
  isModalOpen: boolean,
  isMobile: boolean,
): React.CSSProperties {
  const N = cards.length;
  let relativePos = (index + scrollOffset) % N;
  if (relativePos < 0) relativePos += N;

  const cardWidth = isMobile ? 280 : 600;
  const xStart = isMobile ? 16 : 50;
  const xStep = isMobile ? -6 : -16;
  const yStep = isMobile ? 4 : 8;

  const xOffset = xStart + relativePos * xStep;
  const yOffset = relativePos * yStep;
  const zIndex = BASE_Z + Math.floor(relativePos);
  const topOffset = isMobile ? '25%' : '15%';

  return {
    position: 'absolute',
    left: '50%',
    top: `calc(${topOffset} + ${yOffset}rem)`,
    width: `${cardWidth}px`,
    aspectRatio: '16 / 10',
    zIndex,
    transform: `translateX(calc(-50% + ${xOffset}rem)) translateY(${
      isHovered ? 'calc(-50% - 1.5rem)' : '-50%'
    }) skewY(10deg) scale(${isHovered ? 1.04 : 1}) translateZ(0)`,
    willChange: 'transform',
    pointerEvents: isScrolling || isModalOpen ? 'none' : 'auto',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    transition: isHovered ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
  };
}

export default function DesignHero() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isPlaying, toggle: toggleAmbience } = useAmbience();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const scrollAccum = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef(0);
  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CTA_EMAIL);
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable; fall through silently
    }
  };

  const isModalOpen = selectedIndex !== null;

  // --- Cursor trail ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dots = useRef<TrailDot[]>([]);
  const trailRaf = useRef(0);
  const hoveredRef = useRef(hoveredCard);
  hoveredRef.current = hoveredCard;
  const modalRef = useRef(isModalOpen);
  modalRef.current = isModalOpen;
  const shapeIndex = useRef(0);
  const lastSpawn = useRef({ x: 0, y: 0 });
  const MIN_SPAWN_DIST = 50;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (hoveredRef.current !== null || modalRef.current) return;
      const dx = e.clientX - lastSpawn.current.x;
      const dy = e.clientY - lastSpawn.current.y;
      if (dx * dx + dy * dy < MIN_SPAWN_DIST * MIN_SPAWN_DIST) return;
      lastSpawn.current = { x: e.clientX, y: e.clientY };
      const idx = shapeIndex.current % TRAIL_SHAPES.length;
      shapeIndex.current++;
      dots.current.push({
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 6 + 14,
        life: 1,
        decay: 0.005,
        rotation: (Math.random() - 0.5) * 0.8,
        shape: idx,
        color: TRAIL_SHAPES[idx].color,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ds = dots.current;
      for (let i = ds.length - 1; i >= 0; i--) {
        const d = ds[i];
        d.life -= d.decay;
        if (d.life <= 0) {
          ds.splice(i, 1);
        } else {
          drawTrailShape(ctx, d);
        }
      }
      trailRaf.current = requestAnimationFrame(tick);
    };
    trailRaf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(trailRaf.current);
    };
  }, []);

  const touchY = useRef(0);

  useEffect(() => {
    const FRICTION = 0.94;
    const MIN_VELOCITY = 0.0005;

    const tick = () => {
      if (isModalOpen) {
        rafId.current = 0;
        return;
      }
      scrollAccum.current += velocity.current;
      velocity.current *= FRICTION;
      setScrollOffset(scrollAccum.current);
      if (Math.abs(velocity.current) > MIN_VELOCITY) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        velocity.current = 0;
        rafId.current = 0;
        setIsScrolling(false);
      }
    };

    const startTick = () => {
      if (!rafId.current) rafId.current = requestAnimationFrame(tick);
    };

    const handleWheel = (e: WheelEvent) => {
      if (isModalOpen) return;
      e.preventDefault();
      setIsScrolling(true);
      velocity.current += e.deltaY * 0.0003;
      startTick();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isModalOpen) return;
      touchY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isModalOpen) return;
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const delta = touchY.current - currentY;
      touchY.current = currentY;
      setIsScrolling(true);
      velocity.current += delta * 0.0006;
      startTick();
    };

    const handleTouchEnd = () => {
      startTick();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isModalOpen]);

  const selectedCard = selectedIndex !== null ? cards[selectedIndex] : null;

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-white text-black"
      style={{
        zIndex: 10,
        colorScheme: 'light',
        '--foreground': '0 0 0',
        '--background': '255 255 255',
        '--primary': '9 87 208',
      } as React.CSSProperties}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9999 }}
      />
      <button
        type="button"
        onClick={toggleAmbience}
        className="absolute select-none cursor-pointer bg-transparent border-none p-0 bottom-4 right-6 max-sm:right-3 max-sm:bottom-3"
        style={{ height: isMobile ? '8vh' : '16vh', zIndex: 400 }}
        aria-label={isPlaying ? 'Pause ambience' : 'Play ambience'}
      >
        <div className="relative h-full">
          <img
            src="/design/pot.png"
            alt=""
            className="h-full w-auto"
            style={{ opacity: 0.85 }}
          />
          {isPlaying && (
            <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden>
              {[0, 1, 2].map((i) => {
                const xDrift = [-15, 8, -5][i];
                const noteSrc = '/images/objects/note.png';
                const darkNoteSrc = '/images/objects/whitenote.png';
                return (
                  <span key={i}>
                    <motion.img
                      src={noteSrc}
                      className="absolute dark:hidden"
                      style={{
                        width: '16%',
                        left: '-2%',
                        top: '18%',
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
                      }}
                      initial={{ y: 0, opacity: 0, scale: 0.5 }}
                      animate={{
                        y: [0, -30, -60],
                        x: [0, xDrift, xDrift * 1.5],
                        opacity: [0, 0.9, 0],
                        scale: [0.5, 0.8, 0.4],
                      }}
                      transition={{
                        duration: 2.2 + i * 0.4,
                        repeat: Infinity,
                        delay: i * 0.9,
                        ease: 'easeOut',
                      }}
                    />
                    <motion.img
                      src={darkNoteSrc}
                      className="absolute hidden dark:block"
                      style={{
                        width: '14%',
                        left: '-2%',
                        top: '18%',
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
                      }}
                      initial={{ y: 0, opacity: 0, scale: 0.5 }}
                      animate={{
                        y: [0, -30, -60],
                        x: [0, xDrift, xDrift * 1.5],
                        opacity: [0, 0.9, 0],
                        scale: [0.5, 0.8, 0.4],
                      }}
                      transition={{
                        duration: 2.2 + i * 0.4,
                        repeat: Infinity,
                        delay: i * 0.9,
                        ease: 'easeOut',
                      }}
                    />
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </button>
      <div
        className="absolute inset-0 px-8 sm:px-12 pt-8 sm:pt-12 pointer-events-none"
        style={{ zIndex: 100 }}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight select-none">
          <Link
            href="/about"
            className="font-bold pointer-events-auto hover:opacity-70 transition-opacity"
            style={{ color: 'rgb(var(--primary))' }}
          >
            max4c
          </Link>
          <span style={{ color: 'rgb(var(--foreground) / 0.8)' }}>{' '}designs</span>
        </h1>
      </div>

      <div className={`absolute inset-0 ${isScrolling ? 'pointer-events-none' : ''}`}>
        {cards.map((card, i) => {
          const isHovered = hoveredCard === i;
          const isSelected = selectedIndex === i;
          const wrapperStyle = getCardWrapperStyle(
            i,
            scrollOffset,
            isHovered,
            isScrolling,
            isModalOpen,
            isMobile,
          );
          const tint =
            i % 3 === 0
              ? 'rgba(220, 220, 220, 0.45)'
              : i % 3 === 1
              ? 'rgba(180, 180, 180, 0.5)'
              : 'rgba(230, 230, 230, 0.35)';

          const handleClick = () => setSelectedIndex(i);

          return (
            <div
              key={i}
              style={wrapperStyle}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={handleClick}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-1.25rem',
                    left: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.5rem',
                    color: 'rgb(var(--foreground) / 0.55)',
                    opacity: isHovered && !isSelected ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.label}
                </div>

                {!isSelected && (
                  <motion.div
                    layoutId={`card-${i}`}
                    layoutDependency={selectedIndex}
                    transition={TRANSITION}
                    className="relative w-full h-full overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: tint,
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {card.cta ? (
                      <div
                        className="flex items-center justify-center w-full h-full"
                        style={{ transform: 'skewY(-10deg)' }}
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl sm:text-4xl font-semibold tracking-tight">
                            Work with me
                          </span>
                          <motion.span
                            className="text-3xl sm:text-4xl font-semibold inline-block"
                            animate={{ x: [0, 10, 0] }}
                            transition={{
                              duration: 1.6,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            →
                          </motion.span>
                        </div>
                      </div>
                    ) : (
                      card.video && (
                        <video
                          src={card.video}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      )
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCard && selectedIndex !== null && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/85 backdrop-blur-md p-3 sm:p-8"
            onClick={() => setSelectedIndex(null)}
          >
            <div
              className="relative w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] bg-background flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                layoutId={`card-${selectedIndex}`}
                layoutDependency={selectedIndex}
                transition={TRANSITION}
                className="relative w-full aspect-video flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: selectedCard.cta
                    ? 'rgba(245, 245, 245, 1)'
                    : '#fff',
                  background: selectedCard.cta
                    ? 'linear-gradient(135deg, #f5f5f5 0%, #eee 100%)'
                    : '#fff',
                }}
              >
                {selectedCard.cta ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-8 h-full">
                    <span className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter leading-none text-center">
                      Let&apos;s build.
                    </span>
                    <p className="text-sm mt-2" style={{ color: 'rgba(0,0,0,0.4)' }}>
                      Get in touch
                    </p>
                  </div>
                ) : selectedCard.video ? (
                  <video
                    src={selectedCard.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute w-full h-full object-cover"
                    style={{ inset: '-1px', width: 'calc(100% + 2px)', height: 'calc(100% + 2px)' }}
                  />
                ) : (
                  <span
                    className="font-mono text-xs uppercase tracking-widest"
                    style={{ color: 'rgb(var(--foreground) / 0.4)' }}
                  >
                    Video placeholder
                  </span>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.35, delay: 0.25 }}
                className="w-full px-6 py-5 sm:px-8 sm:py-6 flex flex-wrap items-baseline gap-x-6 gap-y-2"
                style={{}}
              >
                {selectedCard.cta ? (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 w-full">
                    <h2 className="text-base font-semibold tracking-tight">{CTA_DESCRIPTION}</h2>
                    <div className="flex items-center gap-2 ml-auto">
                      <a
                        href={`mailto:${CTA_EMAIL}`}
                        className="text-sm font-medium hover:opacity-70 transition-opacity"
                      >
                        {CTA_EMAIL}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: 'rgb(var(--foreground) / 0.08)',
                          border: '1px solid rgb(var(--foreground) / 0.12)',
                        }}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-semibold tracking-tight">{selectedCard.title}</h2>
                    <span
                      className="font-mono text-[11px] uppercase tracking-widest"
                      style={{ color: 'rgb(var(--foreground) / 0.45)' }}
                    >
                      {selectedCard.year}
                    </span>
                    {selectedCard.role && (
                      <span className="text-sm" style={{ color: 'rgb(var(--foreground) / 0.6)' }}>
                        {selectedCard.role}
                      </span>
                    )}
                    <p
                      className="w-full text-sm leading-relaxed mt-1"
                      style={{ color: 'rgb(var(--foreground) / 0.75)' }}
                    >
                      {selectedCard.description}
                    </p>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
