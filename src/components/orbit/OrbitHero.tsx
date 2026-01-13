'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './OrbitHero.module.css';
import { useAmbience } from '@/components/AmbienceProvider';

type OrbitObject = {
  id: string;
  label: string;
  href?: string;
  order: number;
  kind?: 'link' | 'ambience';
};

const DRIFT_PER_MS = 0.0028; // degrees per ms for gentle auto-spin
const FRICTION = 0.985;
const DRAG_THRESHOLD_DEGREES = 6;
const WHEEL_ROTATION_SCALE = 0.06;
const MAX_WHEEL_VELOCITY = 0.1; // degrees per ms
const WHEEL_FRAME_MS = 16;
const OBJECT_IMAGE = '/images/objects/book.png';
const BIRD_OBJECT_ID = 'bird';
const BIRD_OBJECT_IMAGE = '/images/objects/bird.png';

const getObjectImageSrc = (objectId: string) => {
  switch (objectId) {
    case 'art':
      return '/images/objects/art.png';
    case 'projects':
      return '/images/objects/projects.png';
    case 'tools':
      return '/images/objects/tools.png';
    case 'longevity':
      return '/images/objects/longevity.png';
    case 'quotes':
      return '/images/objects/quotes.png';
    case BIRD_OBJECT_ID:
      return BIRD_OBJECT_IMAGE;
    default:
      return OBJECT_IMAGE;
  }
};

const ORBIT_OBJECTS: OrbitObject[] = [
  { id: 'art', label: 'Art', href: '/wiki/art', order: 1 },
  { id: 'projects', label: 'Projects', href: '/blog', order: 2 },
  { id: 'writing', label: 'Writing', href: '/blog', order: 3 },
  { id: 'longevity', label: 'Longevity', href: '/wiki/longevity', order: 4 },
  { id: BIRD_OBJECT_ID, label: 'Ambience', order: 5, kind: 'ambience' },
  { id: 'quotes', label: 'Quotes', href: '/wiki/quotes', order: 6 },
  { id: 'tools', label: 'Tools', href: '/wiki/tools', order: 7 },
];

const angleDifference = (current: number, previous: number) => {
  let diff = current - previous;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function OrbitHero() {
  const { isPlaying, toggle } = useAmbience();
  const [activeObjectId, setActiveObjectId] = useState<string | null>(null);
  const [tabHidden, setTabHidden] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const stepRef = useRef<(timestamp: number) => void>();
  const preventClickRef = useRef(false);
  const preventResetTimeoutRef = useRef<number>();
  const labelTimeoutRef = useRef<number>();
  const scrollSpinRef = useRef({ lastY: null as number | null, lastTime: 0 });
  const dragStateRef = useRef({
    dragging: false,
    pointerId: null as number | null,
    startAngle: 0,
    lastAngle: 0,
    lastTime: 0,
  });

  const sortedObjects = useMemo(
    () => [...ORBIT_OBJECTS].sort((a, b) => a.order - b.order),
    []
  );

  const applyRotation = useCallback(() => {
    if (ringRef.current) {
      ringRef.current.style.setProperty('--rotation', `${rotationRef.current}deg`);
    }
  }, []);

  const angleFromPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;

    return (Math.atan2(y, x) * 180) / Math.PI;
  }, []);

  const startAnimationLoop = useCallback(() => {
    if (!stepRef.current || rafRef.current !== null) return;
    lastFrameRef.current = null;
    rafRef.current = requestAnimationFrame(stepRef.current);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      const hidden = document.visibilityState === 'hidden';
      setTabHidden(hidden);
      if (hidden) {
        velocityRef.current = 0;
        scrollSpinRef.current = { lastY: null, lastTime: 0 };
      }
      lastFrameRef.current = null;
    };

    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const step = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }

      const delta = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      if (document.visibilityState === 'hidden') {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const drift = DRIFT_PER_MS * delta;
      rotationRef.current = rotationRef.current + drift + velocityRef.current * delta;
      applyRotation();

      velocityRef.current *= FRICTION;

      rafRef.current = requestAnimationFrame(step);
    };

    stepRef.current = step;
    rafRef.current = requestAnimationFrame(step);

    return () => {
      stepRef.current = undefined;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameRef.current = null;
    };
  }, [applyRotation]);

  useEffect(() => {
    return () => {
      window.clearTimeout(preventResetTimeoutRef.current);
      window.clearTimeout(labelTimeoutRef.current);
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    if (!containerRef.current) return;
    const target = event.target as HTMLElement;
    if (target.closest(`.${styles.object}`)) return;
    if (target.closest(`.${styles.centerCard}`)) return;

    const angle = angleFromPoint(event.clientX, event.clientY);

    dragStateRef.current = {
      dragging: true,
      pointerId: event.pointerId,
      startAngle: angle,
      lastAngle: angle,
      lastTime: performance.now(),
    };

    preventClickRef.current = false;
    window.clearTimeout(preventResetTimeoutRef.current);
    containerRef.current.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const state = dragStateRef.current;
    if (!state.dragging || state.pointerId !== event.pointerId) return;

    const now = performance.now();
    const angle = angleFromPoint(event.clientX, event.clientY);
    const deltaAngle = angleDifference(angle, state.lastAngle);
    const elapsed = Math.max(1, now - state.lastTime);

    if (Math.abs(angleDifference(angle, state.startAngle)) > DRAG_THRESHOLD_DEGREES) {
      preventClickRef.current = true;
    }

    rotationRef.current = rotationRef.current + deltaAngle;
    velocityRef.current = deltaAngle / elapsed;
    dragStateRef.current = {
      ...state,
      lastAngle: angle,
      lastTime: now,
    };

    applyRotation();
    startAnimationLoop();
  };

  const endPointerTracking = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const state = dragStateRef.current;
    if (!state.dragging || state.pointerId !== event.pointerId) return;

    try {
      containerRef.current?.releasePointerCapture?.(event.pointerId);
    } catch {
      // ignore
    }

    dragStateRef.current = {
      dragging: false,
      pointerId: null,
      startAngle: 0,
      lastAngle: 0,
      lastTime: 0,
    };

    preventResetTimeoutRef.current = window.setTimeout(() => {
      preventClickRef.current = false;
    }, 180);
  };

  const nudgeRotation = (deltaAngle: number, elapsedMs = 16) => {
    rotationRef.current = rotationRef.current + deltaAngle;
    velocityRef.current = deltaAngle / Math.max(1, elapsedMs);
    applyRotation();
    startAnimationLoop();
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const rawDeltaAngle = event.deltaY * WHEEL_ROTATION_SCALE;
    const maxDeltaAngle = MAX_WHEEL_VELOCITY * WHEEL_FRAME_MS;
    const deltaAngle = clamp(rawDeltaAngle, -maxDeltaAngle, maxDeltaAngle);
    nudgeRotation(deltaAngle, WHEEL_FRAME_MS);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    scrollSpinRef.current = { lastY: touch.clientY, lastTime: event.timeStamp };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    const { lastY, lastTime } = scrollSpinRef.current;
    if (!touch || lastY === null) return;

    const dy = touch.clientY - lastY;
    const dt = Math.max(1, event.timeStamp - lastTime);
    const deltaAngle = dy * 0.28;

    nudgeRotation(deltaAngle, dt);
    scrollSpinRef.current = { lastY: touch.clientY, lastTime: event.timeStamp };
  };

  const handleTouchEnd = () => {
    scrollSpinRef.current = { lastY: null, lastTime: 0 };
  };

  const handleShellClick = (event: React.MouseEvent<HTMLElement>) => {
    if (preventClickRef.current) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(`.${styles.object}`) ||
      target.closest(`.${styles.centerCard}`)
    ) {
      return;
    }

    setActiveObjectId(null);
  };

  const showLabel = (id: string) => {
    setActiveObjectId(id);
    window.clearTimeout(labelTimeoutRef.current);
    labelTimeoutRef.current = window.setTimeout(() => {
      setActiveObjectId((current) => (current === id ? null : current));
    }, 1400);
  };

  return (
    <section
      className={styles.hero}
      aria-label="Max Forsey orbit hero"
      data-paused={tabHidden ? 'true' : 'false'}
      onClick={handleShellClick}
      onWheel={handleWheel}
    >
      <div className={styles.glow} aria-hidden />
      <div className={styles.heroInner}>
        <div
          ref={containerRef}
          className={styles.orbitShell}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointerTracking}
          onPointerCancel={endPointerTracking}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div
            ref={ringRef}
            className={styles.ring}
            data-motion="on"
            style={{ '--rotation': '0deg' } as CSSProperties}
          >
            {sortedObjects.map((object, index) => {
              const angle = (360 / sortedObjects.length) * index;
              const style = {
                '--angle': `${angle}deg`,
              } as CSSProperties;
              const imageClassName = [
                styles.assetImg,
                object.id === 'longevity' ? styles.longevity : '',
              ]
                .filter(Boolean)
                .join(' ');

              const notes =
                object.id === BIRD_OBJECT_ID ? (
                  <span className={styles.audioNotes} aria-hidden>
                    <span className={styles.note} data-note="one" />
                    <span className={styles.note} data-note="two" />
                    <span className={styles.note} data-note="three" />
                    <span className={styles.note} data-note="four" />
                  </span>
                ) : null;

              const content = (
                <>
                  <span className={styles.objectHalo} aria-hidden />
                  <span className={styles.objectInner}>
                    <span className={styles.asset}>
                      <Image
                        src={getObjectImageSrc(object.id)}
                        alt={object.label}
                        width={200}
                        height={200}
                        sizes="120px"
                        priority={index < 3}
                        className={imageClassName}
                      />
                    </span>
                    {notes}
                    <span
                      className={`${styles.objectLabel} ${
                        activeObjectId === object.id ? styles.labelVisible : ''
                      }`}
                    >
                      {object.label}
                    </span>
                  </span>
                </>
              );

              const commonProps = {
                className: styles.object,
                style,
                'data-audio': object.id === BIRD_OBJECT_ID ? 'true' : undefined,
                'data-playing':
                  object.id === BIRD_OBJECT_ID && isPlaying ? 'true' : undefined,
                onMouseEnter: () => {
                  setActiveObjectId(object.id);
                },
                onMouseLeave: () => {
                  setActiveObjectId(null);
                },
                onFocus: () => {
                  setActiveObjectId(object.id);
                },
                onBlur: () => {
                  setActiveObjectId(null);
                },
                onPointerDown: () => showLabel(object.id),
              } as const;

              return (
                object.kind === 'ambience' ? (
                  <button
                    key={object.id}
                    type="button"
                    {...commonProps}
                    aria-pressed={isPlaying}
                    onClick={(event) => {
                      if (preventClickRef.current) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                      }
                      event.preventDefault();
                      event.stopPropagation();
                      toggle();
                    }}
                  >
                    {content}
                  </button>
                ) : (
                  <Link
                    key={object.id}
                    href={object.href ?? '/'}
                    {...commonProps}
                    onClick={(event) => {
                      if (!preventClickRef.current) return;
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    {content}
                  </Link>
                )
              );
            })}
          </div>

          <div className={styles.centerCard}>
            <h1 className={styles.title}>Max Forsey</h1>
          </div>
        </div>

        <noscript>
          <div className={styles.noScript}>
            <p>JavaScript is off — the orbit is still, but everything stays readable.</p>
            <ul>
              {sortedObjects
                .filter((object) => object.kind !== 'ambience')
                .map((object) => (
                  <li key={object.id}>
                    <Link href={object.href ?? '/'}>{object.label}</Link>
                  </li>
                ))}
            </ul>
          </div>
        </noscript>
      </div>
    </section>
  );
}
