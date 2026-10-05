'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface TourStep {
  /** Matches an element with data-tour="<target>" */
  target: string;
  title: string;
  body: React.ReactNode;
  /** Called when the step becomes active (e.g. to prefill the editor) */
  onEnter?: () => void;
  /** Hide "Next" until signals[waitFor] is true, then advance automatically */
  waitFor?: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  open: boolean;
  onClose: (completed: boolean) => void;
  signals?: Record<string, boolean>;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const GAP = 14;
const MARGIN = 16;

function sameRect(a: Rect | null, b: Rect | null) {
  return !!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

export default function GuidedTour({ steps, open, onClose, signals = {} }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number; width: number }>({ top: -9999, left: 0, width: 360 });
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const target = step?.target;
  const waitKey = step?.waitFor;
  const signalReady = !!waitKey && !!signals[waitKey];
  const waiting = !!waitKey && !signalReady;

  // Reset to the first step each time the tour opens
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Enter the step: run its hook and scroll the target into view
  useEffect(() => {
    if (!open || !step) return;
    step.onEnter?.();
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    cardRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  // Track the target's position every frame (handles scrolling, resizing and late layout like Monaco)
  useEffect(() => {
    if (!open || !target) return;
    let frame = 0;
    let last: Rect | null = null;
    const tick = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const next = { top: r.top, left: r.left, width: r.width, height: r.height };
        if (!sameRect(last, next)) {
          last = next;
          setRect(next);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [open, target]);

  // Place the card below the target, else above, else pinned to the bottom of the viewport
  useLayoutEffect(() => {
    if (!open || !rect || !cardRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(360, vw - MARGIN * 2);
    const cardH = cardRef.current.offsetHeight;
    const below = rect.top + rect.height + PAD + GAP;
    const above = rect.top - PAD - GAP - cardH;
    let top: number;
    if (below + cardH <= vh - MARGIN) top = below;
    else if (above >= MARGIN) top = above;
    else top = vh - cardH - MARGIN;
    const left = Math.min(Math.max(rect.left, MARGIN), vw - width - MARGIN);
    setCardPos({ top, left, width });
  }, [open, rect, index]);

  const next = useCallback(() => {
    if (isLast) onClose(true);
    else setIndex((i) => i + 1);
  }, [isLast, onClose]);

  // Auto-advance once a waited-for signal arrives
  useEffect(() => {
    if (open && signalReady) {
      const t = setTimeout(next, 600);
      return () => clearTimeout(t);
    }
  }, [open, index, signalReady, next]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !step) return null;

  return (
    <>
      {/* Spotlight: transparent hole with a huge shadow dimming everything else. Clicks pass through. */}
      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[60] rounded-xl ring-2 ring-blue-400 transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.72)',
          }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        tabIndex={-1}
        className="fixed z-[70] rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl outline-none transition-[top,left] duration-200"
        style={{ top: cardPos.top, left: cardPos.left, width: cardPos.width }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-400">
            Step {index + 1} of {steps.length}
          </span>
          <button onClick={() => onClose(false)} className="text-xs text-gray-500 hover:text-gray-300">
            Skip tour
          </button>
        </div>
        <h2 id="tour-title" className="mt-2 text-base font-semibold text-white">
          {step.title}
        </h2>
        <div className="mt-1.5 text-sm leading-relaxed text-gray-300">{step.body}</div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-blue-400' : 'bg-gray-700'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
              >
                Back
              </button>
            )}
            {waiting ? (
              <span className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                Waiting for you…
              </span>
            ) : (
              <button
                onClick={next}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {isLast ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- First-visit tracking (browser storage can be unavailable; never throw) ----------

const TOUR_DONE_KEY = 'sqlp_tour_done';

export function isTourDone(): boolean {
  try {
    return localStorage.getItem(TOUR_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTourDone() {
  try {
    localStorage.setItem(TOUR_DONE_KEY, '1');
  } catch {
    // ignore
  }
}
