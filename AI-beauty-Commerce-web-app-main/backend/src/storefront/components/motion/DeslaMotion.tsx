'use client';

import React, { useEffect, useRef } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

/**
 * Desla Beauty Motion System
 * Built on Motion for React (https://motion.dev/docs/react) with Motion Primitives
 * patterns (https://motion-primitives.com/docs) and Emil Kowalski's easing physics.
 * GPU-composited transform/opacity only; honors prefers-reduced-motion everywhere.
 */

export const DESLA_EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const DESLA_EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const DESLA_EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
export const DESLA_SPRING_SNAPPY = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.85 };
export const DESLA_SPRING_KPI = { stiffness: 120, damping: 24, mass: 0.7 };

/** Controlled editorial reveal for hero text or section entrances (never replays repetitively). */
export const EditorialReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}> = ({ children, delay = 0, y = 12, className, once = true }) => {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-40px' });

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.38, delay, ease: DESLA_EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Restrained live metric transition for real server-backed KPIs in Creator/Distributor dashboards.
 * Never fabricates numbers — smoothly settles onto the authoritative numeric value,
 * and updates immediately under prefers-reduced-motion.
 */
export const AnimatedMetricValue: React.FC<{
  value: number;
  format?: (n: number) => string;
  className?: string;
}> = ({ value, format = (n) => Math.round(n).toLocaleString('en-NG'), className }) => {
  const prefersReduced = useReducedMotion();
  const safeValue = Number.isFinite(value) ? value : 0;
  const mv = useMotionValue(safeValue);
  const spring = useSpring(mv, DESLA_SPRING_KPI);
  const display = useTransform(spring, (latest) => format(latest));

  useEffect(() => {
    mv.set(safeValue);
  }, [mv, safeValue]);

  if (prefersReduced) {
    return <span className={className}>{format(safeValue)}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
};

/** Origin-centered modal / sheet surface following Emil Kowalski's never-scale-from-0 rule. */
export const DeslaModalFrame: React.FC<{
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
  panelClassName?: string;
  align?: 'center' | 'bottom';
}> = ({ open, onClose, ariaLabel, children, panelClassName = '', align = 'center' }) => {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: DESLA_EASE_OUT }}
          className={`fixed inset-0 z-50 flex ${
            align === 'bottom' ? 'items-end sm:items-center justify-center sm:p-4' : 'items-center justify-center p-4 sm:p-6'
          } font-body`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: DESLA_EASE_OUT }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-xs"
            aria-hidden="true"
          />
          <motion.div
            initial={
              prefersReduced
                ? { opacity: 0 }
                : align === 'bottom'
                  ? { opacity: 0, y: 24, scale: 0.98 }
                  : { opacity: 0, scale: 0.96, y: 8 }
            }
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReduced
                ? { opacity: 0 }
                : align === 'bottom'
                  ? { opacity: 0, y: 20, scale: 0.98 }
                  : { opacity: 0, scale: 0.96, y: 6 }
            }
            transition={{ duration: 0.24, ease: DESLA_EASE_DRAWER }}
            className={`relative z-10 ${panelClassName}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Smooth status / alert feedback container (confirmation, warning, error). */
export const AnimatedStatusBanner: React.FC<{
  show: boolean;
  role?: 'status' | 'alert';
  className?: string;
  children: React.ReactNode;
}> = ({ show, role = 'status', className = '', children }) => {
  const prefersReduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          role={role}
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -3, scale: 0.99 }}
          transition={{ duration: 0.18, ease: DESLA_EASE_OUT }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

